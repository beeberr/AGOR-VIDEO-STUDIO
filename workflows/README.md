# ComfyUI workflows

Export workflows from ComfyUI using **Save (API Format)** and place the resulting JSON files in this folder.

## Important

- The studio intentionally does not ship a made-up workflow. A workflow only works when its exact custom nodes, models, and input conventions are installed on the connected ComfyUI server.
- The first production workflow should be selected after the GPU host and video model/node stack are chosen and tested.
- Use real AGOR source footage for engineering/product demonstrations. AI-generated footage can support atmosphere, transitions, and architectural context, but must not be presented as proof of the actual mechanism.
- Workflow filenames (without `.json`) are the identifiers used by the generation API.

## Planned first workflow

`agor_brand_film` — image/video-to-video and shot-generation workflow for the AGOR brand film. The final graph will be committed only after it is validated against the target ComfyUI installation.
