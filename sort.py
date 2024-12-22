import json
import datetime
import os

FILE_NAME = "jakel101_shaders.json"  # temporary shortcut, might be stdin? or dynamic?
SKIP_TAGS = {"bug", "test"} # tags to be skipped in the gallery.md

def display_field(shader_data) -> str:
    """
    returns a formatted markdown table row with basic information
    """
    # ref: https://github.com/danilw/GPU-my-list-of-bugs#list-of-shader-bugs
    shader_id = shader_data["info"]["id"]
    name = shader_data["info"]["name"]
    description = shader_data["info"]["description"].replace("\n", "<br>") # intable linebreaks?
    date = datetime.datetime.fromtimestamp(int(shader_data["info"]["date"])).strftime("%Y-%m-%d %H:%M")
    # TODO: relative timestamps somehow?
    retrieved = datetime.datetime.fromisoformat(shader_data["info"]["retrieved"]).strftime("%Y-%m-%d %H:%M")
    row_template = f""" \
    | ![https://www.shadertoy.com/view/{shader_id}](https://www.shadertoy.com/media/shaders/{shader_id}.jpg) \
    | [**{name}**](#todo) <br> {description} \
    | published: {date}<br> last saved: {retrieved} |
    """
    return "\n".join([r.lstrip() for r in row_template.splitlines()])

if __name__ == "__main__":
    with open(FILE_NAME, "r") as f:
        loaded_data = json.load(f)

    user_name = loaded_data["userName"]
    retrieval_time = loaded_data["date"]
    print(f"Sorting shaders for user {user_name}")
    # TODO: extract to function(s)
    # make one folder per shader?
    os.makedirs(user_name, exist_ok=True)
    markdown_text = "### Preview gallery\n| Thumbnail (click for source) | Title and Description | Dates |\n| --- | --- | --- |\n"
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
        if not set(shader["info"]["tags"]).intersection(SKIP_TAGS):
            markdown_text += display_field(shader)
    markdown_text += "\n" # lazy footer?

    with open(os.path.join(user_name, "gallery.md"), "w") as f:
        f.write(markdown_text)
