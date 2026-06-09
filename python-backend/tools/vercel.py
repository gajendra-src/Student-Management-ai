import os
import httpx


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {os.environ['VERCEL_TOKEN']}",
        "Content-Type": "application/json",
    }


async def trigger_deploy(branch_name: str) -> str:
    project_id = os.environ["VERCEL_PROJECT_ID"]
    org_id = os.environ.get("VERCEL_ORG_ID", "")
    repo_id_raw = os.environ.get("GITHUB_REPO_ID", "0")
    try:
        repo_id = int(repo_id_raw)
    except ValueError:
        repo_id = 0

    payload = {
        "name": project_id,
        "gitSource": {
            "type": "github",
            "repoId": repo_id,
            "ref": branch_name,
        },
    }
    params = {"teamId": org_id} if org_id else {}

    async with httpx.AsyncClient(timeout=60) as client:
        res = await client.post(
            "https://api.vercel.com/v13/deployments",
            headers=_headers(),
            json=payload,
            params=params,
        )
        data = res.json()
        if res.status_code not in (200, 201):
            raise RuntimeError(f"Vercel deploy failed {res.status_code}: {data}")
        deploy_id = data.get("id", "")
        url = data.get("url", "")
        print(f"  🚀 Deploy triggered: {deploy_id}")
        return f"https://{url}" if url and not url.startswith("http") else url


async def get_latest_deploy_url() -> str | None:
    project_id = os.environ["VERCEL_PROJECT_ID"]
    org_id = os.environ.get("VERCEL_ORG_ID", "")
    params = {"projectId": project_id, "limit": 1}
    if org_id:
        params["teamId"] = org_id

    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(
            "https://api.vercel.com/v6/deployments",
            headers=_headers(),
            params=params,
        )
        deployments = res.json().get("deployments", [])
        if deployments:
            url = deployments[0].get("url", "")
            return f"https://{url}" if url and not url.startswith("http") else url
    return None
