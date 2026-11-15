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
