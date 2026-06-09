import base64
import os
import httpx


def _base_url() -> str:
    return os.environ["JIRA_BASE_URL"]


def _headers() -> dict:
    email = os.environ["JIRA_EMAIL"]
    token = os.environ["JIRA_API_TOKEN"]
    encoded = base64.b64encode(f"{email}:{token}".encode()).decode()
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def fetch_todo_tickets() -> list[dict]:
    project_key = os.environ.get("JIRA_PROJECT_KEY", "SMS")
    jql = f'project = {project_key} AND status = "To Do" ORDER BY created ASC'
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(
            f"{_base_url()}/rest/api/3/search/jql",
            headers=_headers(),
            json={"jql": jql, "maxResults": 10,
                  "fields": ["summary", "description", "labels", "assignee", "status"]},
        )
        res.raise_for_status()
        return res.json().get("issues", [])


async def assign_and_start(issue_key: str, account_id: str) -> None:
    async with httpx.AsyncClient(timeout=30) as client:
        await client.put(
            f"{_base_url()}/rest/api/3/issue/{issue_key}/assignee",
            headers=_headers(), json={"accountId": account_id},
        )
        r = await client.get(
            f"{_base_url()}/rest/api/3/issue/{issue_key}/transitions",
            headers=_headers(),
        )
        r.raise_for_status()
        in_progress = next(
            (t for t in r.json().get("transitions", []) if "in progress" in t["name"].lower()), None
        )
        if in_progress:
            await client.post(
                f"{_base_url()}/rest/api/3/issue/{issue_key}/transitions",
                headers=_headers(), json={"transition": {"id": in_progress["id"]}},
            )


async def post_comment(issue_key: str, text: str) -> None:
    async with httpx.AsyncClient(timeout=30) as client:
        await client.post(
            f"{_base_url()}/rest/api/3/issue/{issue_key}/comment",
            headers=_headers(),
            json={"body": {"type": "doc", "version": 1,
                           "content": [{"type": "paragraph",
                                        "content": [{"type": "text", "text": text}]}]}},
        )


async def close_ticket(issue_key: str) -> None:
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.get(
            f"{_base_url()}/rest/api/3/issue/{issue_key}/transitions",
            headers=_headers(),
        )
        r.raise_for_status()
        done = next(
            (t for t in r.json().get("transitions", [])
             if any(k in t["name"].lower() for k in ["done", "closed", "resolved"])), None
        )
        if done:
            await client.post(
                f"{_base_url()}/rest/api/3/issue/{issue_key}/transitions",
                headers=_headers(), json={"transition": {"id": done["id"]}},
            )
