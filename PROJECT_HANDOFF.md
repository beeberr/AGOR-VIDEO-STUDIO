# AGOR Video Studio — Project Handoff / Continuity Log

Last updated: 2026-11-15
Repository: https://github.com/beeberr/AGOR-VIDEO-STUDIO
Working branch: `feature/video-studio-mvp`

## Non-negotiable project goal

Build a reusable, professional video-production studio for AGOR — not a one-off short-video trimmer. The first production is the full AGOR brand film. The same studio must later support brand films, product demonstrations, advertisements, sales videos, and social content.

Do not redefine the goal as a 35–45 second teaser. The user explicitly said that 35–40 seconds is not enough and asked to return to the original eleven-point production plan. The exact wording/order of those eleven points has not yet been recovered; **do not invent or silently replace them**. Recover the original list from the earlier project conversation before treating any proposed list as approved.

## Product architecture already agreed

1. **AGOR Video Studio = control room**: project management, brief, script, scene/shot plan, source assets, style, versions, review, and final output.
2. **ComfyUI = visual-generation engine**: AI-generated scenes and visual treatments, using a separate reachable GPU-backed ComfyUI service and tested API-format workflows. Do not imply ComfyUI is already operational just because the studio UI has a connection check.
3. **Editing/compositing engine = assembly and finishing**: source selection, shot order, in/out points, timeline, voiceover, music, subtitles, transitions, color/finishing, and export.
4. Use real AGOR footage for the actual hydraulic floor, concealed mechanism, engineering, installation, and product behavior. AI may support mood, architectural context, and transitions, but must not fabricate engineering or product capabilities.

## Current repository / implementation facts

- Public GitHub repository: `beeberr/AGOR-VIDEO-STUDIO`.
- Active working branch: `feature/video-studio-mvp`. Default branch is `main`; keep project work on the feature branch unless explicitly agreed otherwise.
- Existing MVP includes a Hebrew RTL dark studio dashboard, project creation/management, seeded project **AGOR — סרט מותג ראשון**, source video/image/audio uploads, local asset storage and SQLite metadata, timeline clip ordering and in/out points, FFmpeg MP4 rendering, optional voiceover/music tracks, and a ComfyUI health/workflow integration layer.
- README and `production/RECLIP_IMPORT_WORKFLOW.md` contain the run instructions and source-ingest workflow.
- ReClip is the agreed downloader/source intake tool; AGOR Video Studio is the editing/production workspace. Do not restart downloader research or replace the agreed workflow without a concrete reason.
- The app was successfully opened on the user's Android phone at `http://127.0.0.1:8000`; the user shared a screenshot showing the AGOR Video Studio home screen and the project card **AGOR — סרט מותג ראשון**.
- On Android/Termux, the user cloned the repo and created/activated a virtual environment. Dependency installation hit a build failure in `pydantic-core` on Android aarch64 / Python 3.14. Do not assume the environment is fully installed just because the web UI was later visible; verify before giving environment commands.
- The user has at least one downloaded source video available in the current studio/project and wants to begin production from the footage already downloaded, rather than repeat download setup. Confirm which assets are actually present in the project UI before editing.

## Immediate next work session

1. Resume from the existing running AGOR Studio at `127.0.0.1:8000`; do not rebuild the app or restart from a blank project.
2. Open **AGOR — סרט מותג ראשון** and inspect the already-imported/downloaded footage.
3. Recover and display the user's original eleven-point production plan from the earlier conversation. Keep all eleven points; do not shorten the film or substitute a new structure.
4. Build the production around that approved plan, using the downloaded source footage as the starting material. Preserve the full intended film length and story; no arbitrary 35–45 second cap.
5. Work incrementally: inspect assets, map footage to the eleven points, create a rough assembly, then add narration/music/titles and export a review render.
6. Before each session ends, update this file with what was completed, exact current state, next action, and any blockers. Commit changes to `feature/video-studio-mvp`.

## Collaboration rules / avoid repeating past failures

- Treat this repository and this handoff file as the durable source of truth between sessions.
- Before asking the user to repeat decisions, inspect this file, the README, the production workflow, and recent commits/branch state.
- Do not claim that work is saved to GitHub unless a GitHub commit succeeded and its URL/SHA is reported.
- Do not claim a feature works until it has been run and verified.
- Give the user one concrete next action at a time, especially when they are operating from an Android phone.
- Preserve approved decisions. If something is uncertain, mark it as uncertain and ask only for the missing detail.
- The exact original eleven-point list remains a required recovery item. Never fabricate it.

## Session status (2026-11-15)

- The studio home screen is visible and the existing **AGOR — סרט מותג ראשון** project is listed.
- User wants to start from the source video already downloaded and present, and produce a substantial/full brand film following the original eleven points.
- Current blocker: recover the exact original eleven points and inspect the project assets before making an edit.
