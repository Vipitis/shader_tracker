# import argparse #TODO: some CLI
import datetime
import json
import os
import requests
from tqdm.auto import tqdm
from wgpu_shadertoy.api import _get_api_key, shadertoy_from_id

USER_NAME = "jakel101"  # maybe let the user configure this somehow?
HEADERS = {"user-agent": "https://github.com/vipitis/shader-tracker script"}
API_KEY = _get_api_key()


# documentation: https://www.shadertoy.com/howto#q2
# TODO: find better query that avoids false hits?
def get_users_shader_ids(user_name):
    url = f"https://www.shadertoy.com/api/v1/shaders/query/{user_name}"
    response = requests.get(
        url, params={"key": API_KEY, "sort": "newest"}, headers=HEADERS
    )
    if response.status_code != 200:
        raise Exception(f"Failed to get shaders for user {user_name}: {response.text}")
    data = json.loads(response.text)
    return [shader for shader in data["Results"]]


def get_local_ids(user_name):
    # TODO: sort them by last updated?
    return [
        f.split("_")[0]
        for f in os.listdir(user_name)
        if os.path.isdir(os.path.join(user_name, f))
    ]


if __name__ == "__main__":
    shader_ids = get_users_shader_ids(USER_NAME)
    # TODO verbosity flag?
    print(f"Found {len(shader_ids)} shaders for user {USER_NAME!r} on the API")
    local_ids = get_local_ids(USER_NAME)
    print(f"Found {len(local_ids)} shaders for user {USER_NAME!r} locally")
    missing_ids = set(shader_ids) - set(local_ids)
    if missing_ids:
        print(f"Found {len(missing_ids)} shader missing locally")
        # TODO: download only missing shaders (maybe via a CLI flag?)

    # TODO: only download all if flag is set
    all_data = []
    for shader_id in tqdm(shader_ids):
        shader_data = shadertoy_from_id(shader_id)
        if shader_data["Shader"]["info"]["username"] != USER_NAME:
            continue  # skip any false hits (past download?)
        all_data.append(shader_data)

    # closely mirror the of the export button, API differs in several poins:
    # fields like "published", input/output "id" use different values (simple mapping)
    # "src" and "ctype" use different names
    # plenty of fields missing in the download...
    # TODO: we should add and rename the missing fields too normalize it here already.
    construct = {
        "userName": USER_NAME,
        "date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "numShaders": len(all_data),
        "shaders": [s["Shader"] for s in all_data],
    }
    with open(f"{USER_NAME}_shaders.json", "w") as f:
        json.dump(construct, f, indent=2)
