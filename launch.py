# Launch a local shader with wgpu-shadertoy

import argparse
import json
import os
from wgpu_shadertoy import Shadertoy

arg_parser = argparse.ArgumentParser(description="Launch a local shader with wgpu-shadertoy")
arg_parser.add_argument("directory", help="The directory containing the shader files")
arg_parser.add_argument("--json", action="store_true", help="use all information from the data.json")
arg_parser.add_argument("--api", action="store_true", help="use the API to fetch the shader instead")

if __name__ == "__main__":
    args = arg_parser.parse_args()
    print(args)
    
    if args.api:
        shader_id = args.directory.split("\\")[1].split("_")[0] #TODO: use pathlib instead of make it platform agnostic
        print(shader_id)
        shader = Shadertoy.from_id(shader_id)
    else:
        with open(f"{args.directory}/data.json", "r") as f:
            data = json.load(f)
        if args.json:
            shader_data = data
        else:
            # here we read the code from files so we can make changes easier!
            for rp in data["renderpass"]:
                with open(
                    os.path.join(args.directory, f"{rp['name'].replace(' ', '_')}.frag"), "r"
                ) as f:
                    rp["code"] = f.read()
            shader_data = data

        shader_data = {"Shader": shader_data}

        shader = Shadertoy.from_json(shader_data)

    shader.show()