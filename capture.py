import json
import time
import os
import argparse
import numpy as np

from wgpu_shadertoy import Shadertoy
from PIL import Image

FILE_NAME = "jakel101_shaders.json"  # temporary shortcut, might be stdin? or dynamic?

arg_parser = argparse.ArgumentParser(description="Capture a shader preview")
arg_parser.add_argument("--shader_id", type=str, help="The shader id to capture", required=False) # are these two exclusive?
arg_parser.add_argument("--index", type=int, help="The local shaders to capture", required=False, default=0)

def gen_uniforms(framerate=60, duration=10.0, start_date=0):
    delta = 1.0 / framerate
    # start with some basics
    time_struct = time.gmtime(start_date)
    uniforms = {
        "time_float": 0.0,
        "time_delta": delta,
        "frame": 0,
        "framerate": framerate,
        "mouse_pos": (0.0, 0.0, 0.0, 0.0),
        "date": (
            float(time_struct.tm_year),
            float(time_struct.tm_mon - 1),
            float(time_struct.tm_mday),
            time_struct.tm_hour * 3600
            + time_struct.tm_min * 60
            + time_struct.tm_sec,
        ),
    }

    while uniforms["time_float"] <= duration:
        uniforms["time_float"] += delta
        uniforms["frame"] += 1
        uniforms["date"] = (
            uniforms["date"][0],
            uniforms["date"][1],
            uniforms["date"][2],
            uniforms["date"][3] + delta,
        )
        # todo: we step over the date border?
        yield uniforms

    # raise StopIteration

def make_animation(shader_data, framerate=30, duration=5.0, start_date=0):
    # small enough resolution for the thumbnail - to avoid large files
    shader = Shadertoy.from_json(shader_data, offscreen=True, resolution=(320, 180))
    if not shader.complete:
        raise NotImplementedError("Shader is not complete, we can't take proper snapshots... maybe use the thumbnail instead")
    frames = []
    for uniforms in gen_uniforms(framerate, duration, start_date):
        frame = shader.snapshot(**uniforms)
        # we assume it's BGRA, so we make it RGB (will hopefully change in the future)
        img = Image.fromarray(np.asarray(frame)[..., [2, 1, 0, 3]]).convert('RGB')
        frames.append(img)

    animation = Image.new("RGB", frames[0].size)
    # TODO: get the name/path?
    # TODO: consider webp or something with compression.
    # duration is twice as fast to provide a better preview (could be an issue on some screens...)
    animation.save("animation.gif", save_all=True, append_images=frames, duration=1000 / (framerate*2), loop=0)



if __name__ == "__main__":
    args = arg_parser.parse_args()
    with open(FILE_NAME, "r") as f:
        loaded_data = json.load(f)

    selected_shader = {"Shader": loaded_data["shaders"][args.index]}
    print(f"Capturing shader {selected_shader['Shader']['info']['name']}")
    make_animation(selected_shader, framerate=30, duration=4.0, start_date=0)
