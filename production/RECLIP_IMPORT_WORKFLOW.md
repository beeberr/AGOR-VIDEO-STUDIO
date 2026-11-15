# ReClip → AGOR Video Studio

This is the agreed source-ingest workflow for AGOR-owned footage.

## Why two tools

- **ReClip** is the downloader and quality selector. It uses yt-dlp and FFmpeg.
- **AGOR Video Studio** is the project library, clip/timeline editor, audio mixer, and final renderer.

Keep the tools separate for the first production. This avoids duplicating downloader code and lets ReClip handle supported websites while the studio stays focused on editing.

## First AGOR film — import steps

1. Start ReClip on the same computer that will run the studio:
   ```bash
   git clone https://github.com/averygan/reclip.git
   cd reclip
   ./reclip.sh
   ```
   Open `http://localhost:8899`.
2. Paste the two approved AGOR source links, inspect the video details, choose MP4 and the highest suitable resolution, and download each source.
3. Start AGOR Video Studio and open **AGOR — סרט מותג ראשון**.
4. In the project workspace choose **בחירת קבצים** and upload the MP4 files downloaded by ReClip.
5. Confirm both assets appear in the project library. The original files remain the source of truth; edits are non-destructive.
6. Build the first rough cut on the timeline. Use actual AGOR footage for all product movement, submerged-floor, hydraulic, structural, installation, and service claims.
7. Export a review MP4. Do not publish before checking the Hebrew voiceover, subtitles, factual claims, and image quality.

## Approved initial sources

- https://youtu.be/vxmeqn080Gs?si=RMp3XsnLebSOgy2_
- https://youtu.be/YBfDBaege3A?feature=shared

The user has confirmed these are AGOR videos and authorized their use for AGOR production.

## Download troubleshooting

ReClip is a web interface over yt-dlp, not a separate YouTube extraction engine. If YouTube temporarily rate-limits the downloader, retry later rather than repeatedly hammering the same URLs. Update ReClip/yt-dlp before diagnosing an extractor issue. If a source is available as an original camera/export file, prefer that file over a YouTube copy.

## Operational note

For this private workflow, run ReClip and AGOR Studio on a trusted computer or private network. Do not expose the ReClip or studio development servers directly to the public internet. This is an operational boundary, not a restriction on who may watch the AGOR videos.
