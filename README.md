# AGOR Video Studio

A reusable video-production workspace built around **ComfyUI**. AGOR's brand film is the first project; the studio is designed to support future product videos, brand films, advertisements, and social content.

## Current MVP

- Hebrew, right-to-left studio dashboard.
- Project creation and a seeded **AGOR — סרט מותג ראשון** project.
- Upload and local organization of source video, images, and audio.
- Private YouTube import for videos the user owns or is authorized to reuse, using yt-dlp; YouTube links are validated and downloads are limited by configured file size, 15-minute duration, and 10-minute execution timeout.
- Timeline editor: add source clips, reorder them, set per-clip in/out points in seconds, and export a normalized 1080p MP4 with FFmpeg.
- Separate optional voiceover and music tracks, including adjustable music volume; the render mixes the selected audio tracks and loops background music to the film duration.
- Docker image installs FFmpeg from the distribution package manager; no FFmpeg subscription is required.
- ComfyUI connection health check.
- Workflow discovery and a guarded API endpoint for submitting tested ComfyUI API-format workflows.
- SQLite project metadata and local asset storage.

## Run locally

Requires Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt

Install FFmpeg separately on the host and ensure `ffmpeg` is on `PATH` (the Docker image includes it).
cp .env.example .env
uvicorn app.main:app --reload
```

Open http://localhost:8000.

Set `COMFYUI_URL` to the base URL of a running ComfyUI server (for example, `http://127.0.0.1:8188`). The studio can be explored without ComfyUI, but generation requires a reachable GPU-backed ComfyUI instance and at least one tested workflow exported with **Save (API Format)** in the `workflows/` directory.

## Docker

```bash
docker build -t agor-video-studio .
docker run --rm -p 8000:8000 -e COMFYUI_URL=http://host.docker.internal:8188 -v agor-studio-data:/app/data agor-video-studio
```

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `COMFYUI_URL` | ComfyUI server base URL | unset |
| `DATA_DIR` | SQLite database and uploaded assets | `./data` |
| `MAX_UPLOAD_MB` | Per-file upload and YouTube import size limit | `500` |

## Architecture

- `app/main.py` — FastAPI API, SQLite persistence, uploads, private YouTube import, trimmed timeline rendering with optional voiceover/music, and ComfyUI integration.
- `app/static/` — browser dashboard.
- `workflows/` — validated ComfyUI API-format workflow exports.

## Production notes

The app server is the control plane; video generation runs on a separate machine or cloud GPU that hosts ComfyUI. Configure persistent storage for `DATA_DIR` before hosting real client assets. Do not expose an unauthenticated ComfyUI server to the public internet. The current studio API has no user authentication; keep it private and do not expose it publicly until authentication and private object storage are added. Only import videos you own or are authorized to reuse, and follow YouTube's terms and applicable copyright law.

## Product truth

Use authentic AGOR footage to demonstrate the actual hydraulic floor and concealed mechanism. AI imagery is suitable for mood, architectural context, and transitions, but must not invent or misrepresent product engineering. Claims such as patents, load ratings, service guarantees, and exclusivity should be verified before publication.
