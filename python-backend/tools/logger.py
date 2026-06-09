"""Standalone Jira progress logger — imported by all pipeline nodes."""
import os
import base64
from datetime import datetime, timezone
import httpx


def _jira_headers() -> dict:
    email = os.environ["JIRA_EMAIL"]
    token = os.environ["JIRA_API_TOKEN"]
    encoded = base64.b64encode(f"{email}:{token}".encode()).decode()
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def jira_log(issue_key: str | None, message: str) -> None:
    """Fire-and-forget Jira comment. Never raises — pipeline always continues."""
    if not issue_key:
        return
    ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
    base_url = os.environ.get("JIRA_BASE_URL", "")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            await client.post(
                f"{base_url}/rest/api/3/issue/{issue_key}/comment",
                headers=_jira_headers(),
                json={"body": {"type": "doc", "version": 1,
                               "content": [{"type": "paragraph",
                                            "content": [{"type": "text",
                                                         "text": f"[{ts}] {message}"}]}]}},
            )
    except Exception:
        pass
