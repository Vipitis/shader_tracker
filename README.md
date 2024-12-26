# Shader-track?

> [!NOTE]
> Still in early development

## Example gallery can be found [here](./jakel101/README.md)

WIP utility to track your public shadertoy shaders in a github repository.
(maybe this should be a database instead...)
(maybe this repo is just the tools, and the actual data is a submodule so it's tracked individually?)
(should there be like a config file, or config CLI?)
(automate this via sheduled GitHub actions?)

### some goals:
* [x] download all public shaders via the API
* [ ] also accept the "Export All Shaders" / "Export All Public Shaders" buttons on your user profile
* [x] order all your shaders into folders (with image.frag, buffer_a.frag, etc.) with a json too [missing media?]
* [x] have a markdown gallery
    * [ ] gif previews to easily browse
* [x] be able to set some keywords/tags to not show in the gallery
* [ ] launch script for wgpu-shadertoy
* [ ] only update recent shaders
    * [ ] by a given time
    * [ ] most recent range 
    * [x] dynamically backtrack untill there is no more change +/- puffer
* [ ] update specific shaders (by id/link)
* [ ] (maybe) statistics over time/change?


### how to use:
```bash
python gather.py
python sort.py
```
CLI flags: tbd.

### requirements:
* [python requierements](/requierements.txt)
* `SHADERTOY_KEY` env var to access the API