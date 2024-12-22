import json
import os

FILE_NAME = "jakel101_shaders.json"  # temporary shortcut, might be stdin? or dynamic?

if __name__ == "__main__":
    with open(FILE_NAME, "r") as f:
        loaded_data = json.load(f)

    user_name = loaded_data["userName"]
    retrieval_time = loaded_data["date"]
    print(f"Sorting shaders for user {user_name}")
    # make one folder per shader?
    os.makedirs(user_name, exist_ok=True)
    for shader in loaded_data["shaders"]:
        normalized_name = "".join(
            [c if c.isalnum() else "_" for c in shader["info"]["name"]]
        )
        shader_path = os.path.join(
            user_name, f'{shader["info"]["id"]}_{normalized_name}'
        )
        os.makedirs(shader_path, exist_ok=True)
        with open(os.path.join(shader_path, "data.json"), "w") as f:
            shader["info"]["retrieved"] = (
                retrieval_time  # to know how outdated the local copy is
            )
            json.dump(shader, f, indent=2)
        for renderpass in shader["renderpass"]:
            code, rp_name = renderpass["code"], renderpass["name"]
            # maybe not using name and something procedural would be better for legacy reasons?
            with open(
                os.path.join(shader_path, f"{rp_name.replace(' ', '_')}.frag"), "w"
            ) as f:
                f.write(code)
    # TODO: record last time updated?
    # TODO: add gallyer.md with a nice table (including images?) ref: https://github.com/danilw/GPU-my-list-of-bugs#list-of-shader-bugs
