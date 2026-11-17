# FFmpeg setup for AGOR Video Studio

The studio requires **both** `ffmpeg` (rendering and storyboard extraction) and `ffprobe` (reading source-video duration). The home screen reports whether both tools are available.

## Windows

The files `ffmpeg-9.0.2.tar.xz` and `ffmpeg-7.1.5.tar.xz` from FFmpeg's download page are source-code archives. They contain source files and build scripts, not Windows programs, so Windows cannot run or install them directly. Building from source requires a compiler toolchain and development libraries.

For a normal Windows setup, use one of the prebuilt Windows packages linked from [FFmpeg's official download page](https://ffmpeg.org/download.html#build-windows). For example, the Gyan essentials ZIP contains the command-line programs needed by this app. Extract it, add its `bin` directory to `PATH`, then open a new terminal and confirm both commands:

```powershell
ffmpeg -version
ffprobe -version
```

The studio uses H.264 encoding (`libx264`), AAC audio, and image/video filters. Choose a build that includes those features; a GPL essentials/full build is suitable. To avoid changing the whole machine's `PATH`, set `FFMPEG_BINARY` and `FFPROBE_BINARY` in `.env` to the full paths of the two executables.

## Android / Termux

Do not install the Windows build or unpack the FFmpeg source archive in Termux. Use Termux's package manager, which installs a build for Android:

```sh
pkg update
pkg install ffmpeg
ffmpeg -version
ffprobe -version
```

If Python dependency installation fails at `pydantic-core`, that is a separate Python packaging/build issue. FFmpeg cannot fix or cause that Python build error. Keep the existing project files and uploaded media; do not reclone or redownload them to solve it.

## Docker

The repository's `Dockerfile` installs FFmpeg with the Linux distribution package manager when building the image. The source `.tar.xz` is not used by Docker, and no separate FFmpeg subscription or manual download is needed for that runtime.

## Studio diagnostics

Open the studio home screen. The engine panel reports FFmpeg's version and confirms that FFprobe is also available. If it reports that either tool is missing, check the `PATH` of the process running Uvicorn, or set `FFMPEG_BINARY` / `FFPROBE_BINARY` in `.env`, then restart the app.
