# import argparse #TODO: some CLI
import datetime
import json
import os
import requests
from tqdm.auto import tqdm
from wgpu_shadertoy.api import _get_api_key, shadertoy_from_id
import argparse

arg_parser = argparse.ArgumentParser(description="Gather Shadertoy shaders to update")
arg_parser.add_argument("--lookback", type=int, default=2, help="Number of consecutive shaders that must be different to stop gathering new shaders")



USER_NAME = "jakel101"  # maybe let the user configure this somehow?
HEADERS = {"user-agent": "https://github.com/vipitis/shader-tracker script"}
API_KEY = _get_api_key()


# documentation: https://www.shadertoy.com/howto#q2
# TODO: find better query that avoids false hits?
def get_users_shader_ids(user_name:str) -> list[str]:
    """
    returns a list of shader_ids (str) for the given user_name.
    newest is first.
    (might contain some false positives, too slow to check here).
    """
    url = f"https://www.shadertoy.com/api/v1/shaders/query/{user_name}"
    response = requests.get(
        url, params={"key": API_KEY, "sort": "newest"}, headers=HEADERS
    )
    if response.status_code != 200:
        raise Exception(f"Failed to get shaders for user {user_name}: {response.text}")
    data = json.loads(response.text)
    return [shader for shader in data["Results"]]

# don't comeup with crazy datastructures ... maybe do classes eventually.
def get_local_shaders(user_name:str) -> dict[str, dict]:
    """
    gets all locally saved shaders by loading them from individually data.json files.
    returns a dict of shader_id -> shader_data.
    """
    local_shaders = {}
    for dir in os.listdir(user_name):
        shader_path = os.path.join(user_name, dir)
        if os.path.isdir(shader_path):
            with open(os.path.join(shader_path, "data.json"), "r") as f:
                shader_id = dir.split("_")[0]
                local_shaders[shader_id] = json.load(f)
    local_shaders = {k: v for k, v in sorted(local_shaders.items(), key=lambda item: item[1]["info"]["date"], reverse=True)}
    return local_shaders

if __name__ == "__main__":
    args = arg_parser.parse_args()

    retrieval_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
    shader_ids = get_users_shader_ids(USER_NAME)
    # TODO verbosity flag?
    print(f"Found {len(shader_ids)} shaders for user {USER_NAME!r} on the API")
    local_shaders = get_local_shaders(USER_NAME)
    local_ids = local_shaders.keys() # redundant?
    print(f"Found {len(local_ids)} shaders for user {USER_NAME!r} locally")
    missing_ids = set(shader_ids) - set(local_ids)
    if missing_ids:
        print(f"Found {len(missing_ids)} shader missing locally")
        # TODO: download only missing shaders (maybe via a CLI flag?)

    # TODO: only download all if flag is set
    all_data = [] # maybe more like "new_data?"
    same_count = 0
    updated_ids = set()
    for shader_id in tqdm(shader_ids):
        if same_count >= args.lookback:
            # TODO: might be unsorted if there is a larger gap? ( I need a repeatable test case for this...)
            all_data = all_data + [{"Shader":s} for i,s in local_shaders.items() if i not in updated_ids] # inline extend to prepend?
            break
        shader_data = shadertoy_from_id(shader_id) # this is the slow part!!
        shader_data["Shader"]["info"]["retrieved"] = retrieval_time
        if shader_data["Shader"]["info"]["username"] != USER_NAME:
            continue  # skip any false hits (past download?)

        # compare with the local variant, changes in views or name or etc will be missed
        local_version = local_shaders.get(shader_id, {"renderpass":None})
        if shader_data["Shader"]["renderpass"] == local_version["renderpass"]:
            same_count += 1
        else:
            same_count = 0  # reset (or not?)
            # we could only update here to avoid just making changes to metrics?
        all_data.append(shader_data)
        updated_ids.add(shader_id) # keep track of where we have new information.


    # TODO: do we want a "delta" file instead to hand to stdout and than handle sort.py as an append too?

    # closely mirror the of the export button, API differs in several poins:
    # fields like "published", input/output "id" use different values (simple mapping)
    # "src" and "ctype" use different names
    # plenty of fields missing in the download...
    # TODO: we should add and rename the missing fields too normalize it here already.
    construct = {
        "userName": USER_NAME,
        "date": retrieval_time,
        "numShaders": len(all_data),
        "shaders": [s["Shader"] for s in all_data],
    }
    with open(f"{USER_NAME}_shaders.json", "w") as f:
        # this file is like the "full" database?
        json.dump(construct, f, indent=2)
