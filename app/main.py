from __future__ import annotations

import json
import os
import re
import sqlite3
import subprocess
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from typing import Any, Iterator

import httpx
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent.parent
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
except ImportError:
    pass

STATIC_DIR = ROOT / "app" / "static"
WORKFLOWS_DIR = ROOT / "workflows"
DATA_DIR = Path(os.getenv("DATA_DIR", str(ROOT / "data"))).resolve()
UPLOAD_DIR = DATA_DIR / "uploads"
DB_PATH = DATA_DIR / "studio.sqlite3"
COMFYUI_URL = os.getenv("COMFYUI_URL", "").rstrip("/")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "500")) * 1024 * 1024
ALLOWED_EXTENSIONS = {
    ".mp4", ".mov", ".m4v", ".webm", ".avi",
    ".jpg", ".jpeg", ".png", ".webp",
    ".wav", ".mp3", ".m4a", ".aac",
}

app = FastAPI(title="AGOR Video Studio", version="0.1.0")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def connect_db() -> Iterator[sqlite3.Connection]:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db() -> None:
    with connect_db() as db:
        db.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                project_type TEXT NOT NULL,
                brief TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS assets (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL REFERENCES projects(id),
                filename TEXT NOT NULL,
                stored_name TEXT NOT NULL,
                content_type TEXT,
                size_bytes INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        """)
        existing = db.execute("SELECT id FROM projects WHERE id = ?", ("agor-first-film",)).fetchone()
        if not existing:
            db.execute(
                "INSERT INTO projects (id, title, project_type, brief, created_at) VALUES (?, ?, ?, ?, ?)",
                (
                    "agor-first-film",
                    "AGOR — סרט מותג ראשון",
                    "brand-film",
                    "סרט תדמית קולנועי באורך כ-150 שניות. הסיפור: הטכנולוגיה נעלמת, האיכות נשארת. "
                    "להציג רצפה הידראולית נעה לבריכה, מנגנון מוסתר לחלוטין בתוך המים ללא כבלים "
                    "או אביזרי הרמה גלויים, הנדסה וקונסטרוקציית פלדה המעוגנת למבנה, מערכת הידראולית "
                    "מבוססת מים ללא שמן, ייצור וידע ישראלי, ארבעה צוותי שירות וחלקים זמינים בארץ. "
                    "יש להשתמש בצילומי מוצר אמיתיים להוכחת אופן הפעולה; AI ישמש להשלמות אווירה "
                    "ועיצוב בלבד ולא להצגת מנגנון הנדסי שלא צולם.",
                    utc_now(),
                ),
            )


def project_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "title": row["title"],
        "project_type": row["project_type"],
        "brief": row["brief"],
        "created_at": row["created_at"],
    }


def get_project_or_404(project_id: str) -> dict[str, Any]:
    with connect_db() as db:
        row = db.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Project not found")
        project = project_dict(row)
        assets = db.execute(
            "SELECT id, filename, content_type, size_bytes, created_at FROM assets "
            "WHERE project_id = ? ORDER BY created_at DESC",
            (project_id,),
        ).fetchall()
    project["assets"] = [dict(asset) for asset in assets]
    return project


class AssembleRequest(BaseModel):
    asset_ids: list[str] = Field(min_length=2, max_length=30)


class TimelineClip(BaseModel):
    asset_id: str
    start_seconds: float = Field(default=0, ge=0)
    end_seconds: float | None = Field(default=None, gt=0)


class TimelineRenderRequest(BaseModel):
    clips: list[TimelineClip] = Field(min_length=1, max_length=30)
    voiceover_asset_id: str | None = None
    music_asset_id: str | None = None
    music_volume: float = Field(default=0.18, ge=0, le=1)


class YouTubeImportRequest(BaseModel):
    url: str = Field(min_length=10, max_length=2048)


class ProjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    project_type: str = Field(default="marketing-video", max_length=40)
    brief: str = Field(default="", max_length=12000)


@app.on_event("startup")
def startup() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    init_db()


@app.get("/api/health")
async def health() -> dict[str, Any]:
    comfy = {"configured": bool(COMFYUI_URL), "connected": False, "url": COMFYUI_URL or None}
    if COMFYUI_URL:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(f"{COMFYUI_URL}/system_stats")
                comfy["connected"] = response.is_success
        except httpx.HTTPError:
            comfy["connected"] = False
    return {
        "app": "AGOR Video Studio",
        "status": "ok",
        "comfyui": comfy,
        "workflow_count": len(list(WORKFLOWS_DIR.glob("*.json"))) if WORKFLOWS_DIR.exists() else 0,
    }


@app.get("/api/projects")
def list_projects() -> list[dict[str, Any]]:
    with connect_db() as db:
        rows = db.execute("SELECT * FROM projects ORDER BY created_at DESC").fetchall()
    return [project_dict(row) for row in rows]


@app.post("/api/projects")
def create_project(payload: ProjectCreate) -> dict[str, Any]:
    project_id = str(uuid.uuid4())
    with connect_db() as db:
        db.execute(
            "INSERT INTO projects (id, title, project_type, brief, created_at) VALUES (?, ?, ?, ?, ?)",
            (project_id, payload.title.strip(), payload.project_type, payload.brief.strip(), utc_now()),
        )
    return get_project_or_404(project_id)


@app.get("/api/projects/{project_id}")
def get_project(project_id: str) -> dict[str, Any]:
    return get_project_or_404(project_id)


@app.post("/api/projects/{project_id}/assets")
async def upload_asset(project_id: str, file: UploadFile = File(...)) -> dict[str, Any]:
    get_project_or_404(project_id)
    original_name = Path(file.filename or "upload").name
    extension = Path(original_name).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Supported formats: common video, image and audio files")
    asset_id = str(uuid.uuid4())
    stored_name = f"{asset_id}{extension}"
    project_dir = UPLOAD_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    destination = project_dir / stored_name
    total = 0
    try:
        with destination.open("wb") as output:
            while chunk := await file.read(1024 * 1024):
                total += len(chunk)
                if total > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_BYTES // (1024 * 1024)} MB")
                output.write(chunk)
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    with connect_db() as db:
        db.execute(
            "INSERT INTO assets (id, project_id, filename, stored_name, content_type, size_bytes, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (asset_id, project_id, original_name, stored_name, file.content_type, total, utc_now()),
        )
    return {
        "id": asset_id,
        "filename": original_name,
        "content_type": file.content_type,
        "size_bytes": total,
    }


@app.post("/api/projects/{project_id}/import-youtube")
def import_youtube_asset(project_id: str, payload: YouTubeImportRequest) -> dict[str, Any]:
    """Download one YouTube video the user owns or is authorized to reuse."""
    get_project_or_404(project_id)
    parsed = urlparse(payload.url.strip())
    allowed_hosts = {"youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"}
    if parsed.scheme != "https" or parsed.hostname not in allowed_hosts or parsed.username or parsed.password:
        raise HTTPException(status_code=400, detail="יש להזין קישור HTTPS תקין מ-YouTube בלבד")
    if parsed.hostname == "youtu.be" and not parsed.path.strip("/"):
        raise HTTPException(status_code=400, detail="קישור YouTube לא תקין")
    if parsed.hostname != "youtu.be" and parsed.path not in {"/watch", "/shorts", "/live", "/embed"} and not parsed.path.startswith(("/shorts/", "/live/", "/embed/")):
        raise HTTPException(status_code=400, detail="קישור YouTube לא תקין")

    try:
        import yt_dlp  # noqa: F401
    except ImportError as exc:
        raise HTTPException(status_code=503, detail="מנוע ההורדה אינו מותקן בשרת") from exc

    project_dir = UPLOAD_DIR / project_id
    project_dir.mkdir(parents=True, exist_ok=True)
    asset_id = str(uuid.uuid4())
    output_template = project_dir / f"{asset_id}.%(ext)s"
    command = [
        "yt-dlp", "--no-playlist", "--no-warnings",
        "--max-filesize", f"{MAX_UPLOAD_BYTES}",
        "--match-filter", "duration <= 900",
        "--format", "best[ext=mp4]/best",
        "--merge-output-format", "mp4",
        "--output", str(output_template),
        payload.url.strip(),
    ]
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=600)
    except subprocess.TimeoutExpired as exc:
        for candidate in project_dir.glob(f"{asset_id}.*"):
            candidate.unlink(missing_ok=True)
        raise HTTPException(status_code=504, detail="הורדת הסרטון חרגה ממגבלת 10 דקות") from exc
    except OSError as exc:
        raise HTTPException(status_code=503, detail="לא ניתן להפעיל את מנוע ההורדה בשרת") from exc

    downloaded = [path for path in project_dir.glob(f"{asset_id}.*") if path.is_file()]
    if result.returncode != 0 or not downloaded:
        for candidate in downloaded:
            candidate.unlink(missing_ok=True)
        detail = (result.stderr or result.stdout or "ההורדה נכשלה")[-1200:]
        raise HTTPException(status_code=422, detail=detail)
    source = downloaded[0]
    size_bytes = source.stat().st_size
    if size_bytes > MAX_UPLOAD_BYTES:
        source.unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail="הסרטון גדול ממגבלת ההעלאה המוגדרת באולפן")
    extension = source.suffix.lower()
    if extension not in ALLOWED_EXTENSIONS or extension not in {".mp4", ".webm", ".m4v", ".mov"}:
        source.unlink(missing_ok=True)
        raise HTTPException(status_code=415, detail="YouTube החזיר פורמט וידאו שאינו נתמך")
    stored_name = source.name
    filename = f"YouTube-{asset_id[:8]}{extension}"
    with connect_db() as db:
        db.execute(
            "INSERT INTO assets (id, project_id, filename, stored_name, content_type, size_bytes, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (asset_id, project_id, filename, stored_name, "video/mp4" if extension == ".mp4" else "video/" + extension.lstrip("."), size_bytes, utc_now()),
        )
    return {"id": asset_id, "filename": filename, "size_bytes": size_bytes, "message": "הסרטון נשמר בפרויקט"}


@app.get("/api/workflows")
def list_workflows() -> dict[str, Any]:
    names = sorted(path.stem for path in WORKFLOWS_DIR.glob("*.json")) if WORKFLOWS_DIR.exists() else []
    return {"workflows": names}


@app.post("/api/projects/{project_id}/generate")
async def generate(project_id: str, workflow_name: str) -> dict[str, Any]:
    get_project_or_404(project_id)
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,80}", workflow_name):
        raise HTTPException(status_code=400, detail="Invalid workflow name")
    workflow_path = WORKFLOWS_DIR / f"{workflow_name}.json"
    if not workflow_path.is_file():
        raise HTTPException(
            status_code=409,
            detail="No ComfyUI workflow is installed yet. Add and test a workflow export in the workflows folder first.",
        )
    if not COMFYUI_URL:
        raise HTTPException(status_code=503, detail="ComfyUI is not configured. Set COMFYUI_URL to a running GPU instance.")
    try:
        workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail="The selected workflow file is invalid") from exc
    if not isinstance(workflow, dict):
        raise HTTPException(status_code=400, detail="Workflow must be a ComfyUI API-format JSON object")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{COMFYUI_URL}/prompt", json={"prompt": workflow})
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Could not submit workflow to ComfyUI: {exc}") from exc
    return {"submitted": True, "prompt_id": result.get("prompt_id"), "node_errors": result.get("node_errors", {})}


@app.post("/api/projects/{project_id}/assemble")
def assemble_project(project_id: str, payload: AssembleRequest) -> dict[str, Any]:
    """Assemble selected project video assets in the supplied order using FFmpeg."""
    get_project_or_404(project_id)
    if len(set(payload.asset_ids)) != len(payload.asset_ids):
        raise HTTPException(status_code=400, detail="Duplicate asset IDs are not allowed")
    with connect_db() as db:
        placeholders = ",".join("?" for _ in payload.asset_ids)
        rows = db.execute(
            f"SELECT id, filename, stored_name FROM assets WHERE project_id = ? AND id IN ({placeholders})",
            [project_id, *payload.asset_ids],
        ).fetchall()
    by_id = {row["id"]: row for row in rows}
    if len(by_id) != len(payload.asset_ids):
        raise HTTPException(status_code=400, detail="One or more assets do not belong to this project")
    selected = [by_id[asset_id] for asset_id in payload.asset_ids]
    video_exts = {".mp4", ".mov", ".m4v", ".webm", ".avi"}
    if any(Path(row["filename"]).suffix.lower() not in video_exts for row in selected):
        raise HTTPException(status_code=415, detail="This first version assembles video clips only")
    ffmpeg = os.getenv("FFMPEG_BINARY", "ffmpeg")
    try:
        check = subprocess.run([ffmpeg, "-version"], capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.TimeoutExpired):
        raise HTTPException(status_code=503, detail="FFmpeg is not installed on the studio server")
    if check.returncode != 0:
        raise HTTPException(status_code=503, detail="FFmpeg is unavailable on the studio server")
    render_id = str(uuid.uuid4())
    render_dir = DATA_DIR / "renders" / project_id
    render_dir.mkdir(parents=True, exist_ok=True)
    output_path = render_dir / (render_id + ".mp4")
    concat_path = render_dir / (render_id + ".txt")
    lines = []
    for row in selected:
        source = UPLOAD_DIR / project_id / row["stored_name"]
        if not source.is_file():
            raise HTTPException(status_code=404, detail="A source file is missing")
        lines.append("file '" + source.as_posix() + "'")
    concat_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    try:
        result = subprocess.run(
            [ffmpeg, "-y", "-f", "concat", "-safe", "0", "-i", str(concat_path),
             "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
             "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", str(output_path)],
            capture_output=True, text=True, timeout=900,
        )
        if result.returncode != 0 or not output_path.is_file():
            output_path.unlink(missing_ok=True)
            raise HTTPException(status_code=422, detail=(result.stderr or "FFmpeg assembly failed")[-1800:])
    except subprocess.TimeoutExpired:
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=504, detail="Video assembly exceeded the 15-minute limit")
    finally:
        concat_path.unlink(missing_ok=True)
    return {"render_id": render_id, "status": "completed",
            "download_url": f"/api/projects/{project_id}/renders/{render_id}.mp4",
            "message": "הסרט הורכב בהצלחה"}


@app.post("/api/projects/{project_id}/render")
def render_timeline(project_id: str, payload: TimelineRenderRequest) -> dict[str, Any]:
    """Render an ordered, trimmed video timeline with optional voiceover and music tracks."""
    get_project_or_404(project_id)
    clip_ids = [clip.asset_id for clip in payload.clips]
    extra_ids = [asset_id for asset_id in (payload.voiceover_asset_id, payload.music_asset_id) if asset_id]
    all_ids = list(dict.fromkeys(clip_ids + extra_ids))
    with connect_db() as db:
        placeholders = ",".join("?" for _ in all_ids)
        rows = db.execute(
            f"SELECT id, filename, stored_name FROM assets WHERE project_id = ? AND id IN ({placeholders})",
            [project_id, *all_ids],
        ).fetchall()
    by_id = {row["id"]: row for row in rows}
    if len(by_id) != len(all_ids):
        raise HTTPException(status_code=400, detail="קובץ אחד או יותר לא שייך לפרויקט הזה")

    video_exts = {".mp4", ".mov", ".m4v", ".webm", ".avi"}
    audio_exts = {".wav", ".mp3", ".m4a", ".aac"}
    clips = []
    total_duration = 0.0
    ffprobe = os.getenv("FFPROBE_BINARY", "ffprobe")
    ffmpeg = os.getenv("FFMPEG_BINARY", "ffmpeg")
    for clip in payload.clips:
        row = by_id[clip.asset_id]
        if Path(row["filename"]).suffix.lower() not in video_exts:
            raise HTTPException(status_code=415, detail="ציר העריכה מקבל קובצי וידאו בלבד")
        source = UPLOAD_DIR / project_id / row["stored_name"]
        if not source.is_file():
            raise HTTPException(status_code=404, detail="קובץ וידאו חסר")
        try:
            probe = subprocess.run(
                [ffprobe, "-v", "error", "-show_entries", "format=duration",
                 "-of", "default=noprint_wrappers=1:nokey=1", str(source)],
                capture_output=True, text=True, timeout=15,
            )
            duration = float(probe.stdout.strip()) if probe.returncode == 0 else 0
        except (OSError, ValueError, subprocess.TimeoutExpired):
            duration = 0
        if duration <= 0:
            raise HTTPException(status_code=422, detail=f"לא ניתן לקרוא את אורך הסרטון: {row['filename']}")
        end = clip.end_seconds if clip.end_seconds is not None else duration
        if clip.start_seconds >= end or end > duration + 0.05:
            raise HTTPException(status_code=422, detail=f"טווח החיתוך אינו תקין: {row['filename']}")
        clip_duration = end - clip.start_seconds
        total_duration += clip_duration
        clips.append((source, clip.start_seconds, end))

    if total_duration > 900:
        raise HTTPException(status_code=413, detail="אורך הסרט המורכב מוגבל ל-15 דקות")

    voice_path = None
    music_path = None
    if payload.voiceover_asset_id:
        row = by_id[payload.voiceover_asset_id]
        if Path(row["filename"]).suffix.lower() not in audio_exts:
            raise HTTPException(status_code=415, detail="קריינות חייבת להיות קובץ אודיו")
        voice_path = UPLOAD_DIR / project_id / row["stored_name"]
    if payload.music_asset_id:
        row = by_id[payload.music_asset_id]
        if Path(row["filename"]).suffix.lower() not in audio_exts:
            raise HTTPException(status_code=415, detail="מוזיקת רקע חייבת להיות קובץ אודיו")
        music_path = UPLOAD_DIR / project_id / row["stored_name"]
    for path in (voice_path, music_path):
        if path and not path.is_file():
            raise HTTPException(status_code=404, detail="קובץ אודיו חסר")

    try:
        check = subprocess.run([ffmpeg, "-version"], capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.TimeoutExpired):
        raise HTTPException(status_code=503, detail="FFmpeg אינו מותקן בשרת")
    if check.returncode != 0:
        raise HTTPException(status_code=503, detail="FFmpeg אינו זמין")

    render_id = str(uuid.uuid4())
    render_dir = DATA_DIR / "renders" / project_id
    render_dir.mkdir(parents=True, exist_ok=True)
    output_path = render_dir / (render_id + ".mp4")
    command = [ffmpeg, "-y"]
    filters = []
    for index, (source, start, end) in enumerate(clips):
        command.extend(["-i", str(source)])
        filters.append(
            f"[{index}:v:0]trim=start={start:.3f}:end={end:.3f},setpts=PTS-STARTPTS,"
            "scale=1920:1080:force_original_aspect_ratio=decrease,"
            "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=25,setsar=1"
            f"[v{index}]"
        )
    video_inputs = "".join(f"[v{i}]" for i in range(len(clips)))
    filters.append(f"{video_inputs}concat=n={len(clips)}:v=1:a=0[vout]")

    audio_input_index = len(clips)
    audio_labels = []
    if voice_path:
        command.extend(["-i", str(voice_path)])
        filters.append(
            f"[{audio_input_index}:a:0]aresample=48000,apad,atrim=duration={total_duration:.3f},"
            f"asetpts=PTS-STARTPTS[voice]"
        )
        audio_labels.append("[voice]")
        audio_input_index += 1
    if music_path:
        command.extend(["-stream_loop", "-1", "-i", str(music_path)])
        filters.append(
            f"[{audio_input_index}:a:0]aresample=48000,volume={payload.music_volume:.3f},"
            f"atrim=duration={total_duration:.3f},asetpts=PTS-STARTPTS[music]"
        )
        audio_labels.append("[music]")
    if len(audio_labels) == 2:
        filters.append("[voice][music]amix=inputs=2:duration=longest:dropout_transition=2[aout]")
    elif audio_labels:
        filters.append(f"{audio_labels[0]}anull[aout]")

    command.extend(["-filter_complex", ";".join(filters), "-map", "[vout]"])
    if audio_labels:
        command.extend(["-map", "[aout]", "-c:a", "aac", "-b:a", "192k"])
    else:
        command.append("-an")
    command.extend([
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "19",
        "-t", f"{total_duration:.3f}", "-movflags", "+faststart", str(output_path),
    ])
    try:
        result = subprocess.run(command, capture_output=True, text=True, timeout=1800)
        if result.returncode != 0 or not output_path.is_file():
            output_path.unlink(missing_ok=True)
            raise HTTPException(status_code=422, detail=(result.stderr or "FFmpeg render failed")[-1800:])
    except subprocess.TimeoutExpired:
        output_path.unlink(missing_ok=True)
        raise HTTPException(status_code=504, detail="ייצוא הסרט חרג ממגבלת 30 דקות")
    return {
        "render_id": render_id,
        "status": "completed",
        "duration_seconds": round(total_duration, 2),
        "download_url": f"/api/projects/{project_id}/renders/{render_id}.mp4",
        "message": "הסרט יוצא בהצלחה",
    }


@app.get("/api/projects/{project_id}/renders/{filename}")
def download_render(project_id: str, filename: str) -> FileResponse:
    get_project_or_404(project_id)
    if not re.fullmatch(r"[0-9a-f-]{36}\.mp4", filename):
        raise HTTPException(status_code=404, detail="Render not found")
    path = DATA_DIR / "renders" / project_id / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Render not found")
    return FileResponse(path, media_type="video/mp4", filename="agor-" + filename)


@app.get("/api/generations/{prompt_id}")
async def generation_status(prompt_id: str) -> dict[str, Any]:
    if not COMFYUI_URL:
        raise HTTPException(status_code=503, detail="ComfyUI is not configured")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{COMFYUI_URL}/history/{prompt_id}")
            response.raise_for_status()
            history = response.json()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Could not read ComfyUI history: {exc}") from exc
    return {"prompt_id": prompt_id, "history": history.get(prompt_id, {})}


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
