# AGOR Video Studio — Project Handoff / Continuity Log

Last updated: 2026-11-15
Repository: https://github.com/beeberr/AGOR-VIDEO-STUDIO
Working branch: `feature/video-studio-mvp`

## Non-negotiable project goal

Build a reusable, professional video-production studio for AGOR — not a one-off short-video trimmer. The first production is the full AGOR brand film. The same studio must later support brand films, product demonstrations, advertisements, sales videos, and social content.

Do not redefine the goal as a 35–45 second teaser. The user explicitly said that 35–40 seconds is not enough and asked to return to the original eleven-point production plan. The user's exact source wording for the seven original principles and four additional emphases is now preserved in `production/AGOR_FILM_11_POINT_BRIEF.md`. Keep that document canonical; do not invent, silently replace, merge, or paraphrase its points.

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


## Permanent continuity rule — user instruction (2026-11-15)

The user explicitly requires that project work, decisions, plans, source links, the exact eleven-point brief once recovered, progress, blockers, and next steps be recorded in GitHub as work proceeds. Do not make the user repeatedly search for or re-explain earlier project material.

At the start of every work session:
1. Read this handoff file and relevant project docs on the working branch.
2. Review recent commits and current repository state before proposing work.
3. Continue from the recorded next step; do not restart or substitute a new plan.

During and at the end of every work session:
1. Update this handoff/log with decisions, completed work, exact current state, blockers, and the next concrete action.
2. Commit the update to `feature/video-studio-mvp` (or the explicitly agreed working branch).
3. Tell the user exactly what was saved and provide the commit/link.
4. Never say something was saved unless the GitHub write returned success.

If an important plan or source is mentioned but not present in the current chat or repository, record that it is pending recovery and ask the user to provide it only when necessary. Do not invent missing content. Once the original eleven points are supplied, preserve their exact wording and order in a separate canonical document (for example `production/AGOR_FILM_11_POINT_BRIEF.md`) and link it from this handoff file. The eleven-point brief must remain distinct from implementation notes and must not be paraphrased into a replacement plan without the user's approval.


## Canonical source brief — 11 company strengths (2026-11-15)

The user supplied the source wording for a film presenting the company's strengths: seven original principles plus four additional emphases. The exact text is preserved in `production/AGOR_FILM_11_POINT_BRIEF.md`. Keep the seven and four sections separate and preserve the wording/order. Do not merge repeated service-team points or alter company claims without user approval. The user's message ended with the standalone word «יש», so the source may be incomplete; ask for the continuation when appropriate. This canonical source brief, not a reconstructed summary, is the basis for the film's content.


## Historical context recovery note (2026-11-15)

A personal-context search for the first AGOR film conversation found only continuation summaries, not the full first conversation or transcript. It recovered an earlier creative direction (premium cinematic film for AGOR, Israeli maker of hydraulic movable pool floors; quiet luxury, architectural excellence, engineering strength, safety, innovation; photorealistic luxury villas/pools, refined materials, cinematic camera/light, technically credible mechanism; factory, engineering, mechanism, real projects, Hebrew voiceover). This is recorded separately in `production/AGOR_FILM_11_POINT_BRIEF.md` as secondary context, not verbatim source. The first conversation's complete contents remain unavailable from the retrieved history. Do not claim full recovery. Continue using the canonical 11-point source exactly as provided by the user.


## AGOR brand film — first script saved (2026-11-15)

Created `production/AGOR_BRAND_FILM_SCRIPT_V1.md`, a first full-length script draft (~2:45 target) mapped to all seven original principles and four additional emphases. It includes eight scenes, voiceover, visual direction, on-screen text, source-point mapping, and fact-check/production notes. This is a proposal for user review, not an approved locked script. Next: receive user feedback, revise, then inventory available downloaded source footage and map real clips to scenes before generating voiceover and editing. Do not impose a 35–40 second limit.


## User's standing GitHub memory/workflow instruction — reaffirmed (2026-11-15)

The user explicitly says that the repository is for continuity because they remember earlier discussions while the assistant may not have access to every full prior conversation. They want **every meaningful idea, decision, plan, requirement, source, and work result from all AGOR project conversations** summarized and saved to GitHub, so future sessions can resume without making them search for or repeat material.

Required operating procedure:
- Treat this repository as the durable project knowledge base for AGOR Video Studio and AGOR brand-film production.
- Capture information incrementally whenever an idea or decision reaches a useful conclusion; do not wait only until the end of a long session.
- Keep source wording and user-approved decisions intact. Clearly distinguish verbatim source, assistant proposal, user-approved decision, open question, and unverified claim.
- Store substantial topics in their own focused documents under suitable folders (for example `production/`, `design/`, `architecture/`, `research/`); link each from this handoff file or an appropriate index.
- At each meaningful milestone and before ending a work session, update the relevant topic document(s) and this handoff with status, decisions, open questions, blockers, and the next action; commit to `feature/video-studio-mvp` unless another branch is agreed.
- At the start of a new AGOR session, read this handoff, the linked topic documents relevant to the request, and recent repository history before asking the user to repeat anything.
- After a successful save, report the exact changed file(s), commit SHA, and GitHub link. If a write fails or GitHub is unavailable, say so plainly and do not imply that it was saved.
- Do not claim to monitor conversations or save automatically in the background. The assistant can only record information when actively working in a conversation and when the GitHub connection is available. The user's requested workflow is to make the save part of each meaningful project step, not to promise invisible always-on syncing.
- This instruction applies across AGOR-related conversations. For a different independent project, use a separate repository or clearly separated knowledge base rather than mixing unrelated project material into AGOR.


## Editing session update — 2026-11-15

- Resumed from the saved full-length brand-film script and canonical eleven-point brief.
- Confirmed supporting project documents are available in the user's Library: `AGOR_17_Milestones_Illustrated.pdf`, `AGOR_17_Milestones.pdf`, and `AGOR 300X150.pdf`. These support technical accuracy and shot planning.
- The previously downloaded video is understood to be present in the user's local studio, but its media file is not accessible in this chat's file search or GitHub repository. Do not ask the user to download it again.
- Created `production/AGOR_FOOTAGE_INVENTORY.md` to record this status and the immediate next step: inspect the already-imported assets in the local studio using one screenshot of the project's media library, then map them to the eight script scenes and eleven source points.
- No video edit or render has been performed yet; do not imply otherwise.


## Confirmed local workspace inventory — 2026-11-15

The user pasted the actual PROJECT WORKSPACE content for "AGOR — סרט מותג ראשון". The project description states a cinematic brand film target of approximately 150 seconds and the core story line: **"הטכנולוגיה נעלמת, האיכות נשארת"**. Required truthful product details: hydraulic movable pool floor; mechanism fully concealed inside the water with no visible cables or lifting accessories; steel engineering/construction anchored to the building; water-based hydraulic system with no oil; Israeli manufacturing/know-how; four service teams and locally available parts. Real product footage must prove operation; AI is only for atmosphere/design supplementation, never to fabricate an unseen engineering mechanism.

Visible local media:
- קובץ פרויקטים אגור - Agor Engineering (1080p, h264) (1).mp4 — 137.6 MB. Available in the local workspace, not yet confirmed added to timeline.
- New hydraulic movable floor for surf pool by Agor Engineering - Agor Engineering (1080p, h264)-3.mp4 — 0.0 MB. Treat as an empty/incomplete import; do not use until validated.

Immediate next user action: click "+ לציר העריכה" next to the 137.6 MB file only, then show the timeline state. Do not ask to download that source again. No editing/rendering has yet been performed.
See production/AGOR_FOOTAGE_INVENTORY.md for full inventory and exact workspace description.


## Timeline confirmation — 2026-11-15

A user screenshot confirms the 137.6 MB AGOR project video is now clip 1 in the editing timeline, start=0 seconds, optional end field blank (full source). No second clip is present. Voiceover and background music are both set to none. No trims, narration, music, or export have been applied. Do not export the untouched source as the finished film. Next: inspect actual source moments (especially floor movement and concealed underwater mechanism) using preview/screen captures or a short screen recording; no repeat download of the 137.6 MB source.


## Workflow decision — automated video storyboard (2026-11-15)

The user rejected manually sending repeated screenshots while reviewing footage. Do not request screenshot after screenshot. Planned solution: implement a built-in storyboard/contact-sheet feature that extracts representative frames at regular intervals from the already-imported source video and displays them with timestamps in one consolidated view. Keep the original source untouched and never fabricate technical mechanism visuals. This is a product decision only; feature is not yet implemented or available. Implement and verify it on `feature/video-studio-mvp` before telling the user to use it.


## Automatic Storyboard feature — implementation status (2026-11-15)

Implemented on branch `feature/video-studio-mvp`:
- Video assets now have a “לוח תמונות” action in the asset library.
- Clicking it calls a FastAPI endpoint that probes the original asset with FFprobe and extracts representative JPEG frames with FFmpeg.
- User-selectable sampling interval: 5, 10, 15, or 30 seconds. For long videos, interval is automatically increased to keep the gallery at or below 80 frames.
- Frames are displayed in a responsive gallery with timestamps; thumbnails are cached under DATA_DIR/storyboards and source media is not modified.
- Empty/missing/non-video assets return clear errors; this is useful for the zero-byte second asset (it will not be processed).
- Added README documentation.

Files changed: `app/main.py`, `app/static/index.html`, `app/static/app.js`, `app/static/styles.css`, `README.md`.

Important deployment state: code is committed to GitHub, but the user's Android/Termux server at 127.0.0.1:8000 does not update automatically from a GitHub commit. User must pull the latest branch and restart the app before the new button appears. Runtime verification against the user's actual 137.6 MB video has not yet been performed. Do not claim storyboard generation succeeded until the user runs it and reports the result.

Next: guide the user through updating the existing local clone on Android, one command at a time, without recloning or re-downloading the source video. Then open the AGOR project and tap “לוח תמונות” next to the 137.6 MB clip.
