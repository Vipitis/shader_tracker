# Shader-track?

WIP utility to track your public shadertoy shaders in a github repository.
(maybe this should be a database instead...)

### some goals:
* [ ] download all public shaders via the API
* [ ] also accept the "Export All Shaders" / "Export All Public Shaders" buttons on your user profile
* [ ] order all your shaders into folders (with image.frag, buffer_a.frag, etc.) with a json too
* [ ] have a markdown gallery with gif previews to easily browse
* [ ] be able to set some keywords/tags to not show in the gallery
* [ ] launch script for wgpu-shadertoy
* [ ] only update recent shaders (by a given time, or most recent range, dynamically backtrack untill there is no more change +/- puffer?)
* [ ] update specific shaders (by id/link)
* [ ] (maybe) statistics over time/change?


### how to use:
```bash
python gather.py
```
tbd.

### requirements:
* [python requierements](/requierements.txt)
* `SHADERTOY_KEY` env var to access the API