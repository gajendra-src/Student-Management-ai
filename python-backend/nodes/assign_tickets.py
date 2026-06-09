import os
import base64
import httpx
from state import AgentState
from tools.logger import jira_log

USERS = ["user1", "user2", "user3"]


def _jira_headers() -> dict:
    email = os.environ["JIRA_EMAIL"]
    token = os.environ["JIRA_API_TOKEN"]
    encoded = base64.b64encode(f"{email}:{token}".encode()).decode()
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


async def _move_to_active_sprint(issue_key: str) -> None:
    """Add ticket to the active sprint so it shows on the Jira board."""
    base_url = os.environ.get("JIRA_BASE_URL", "")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.get(
                f"{base_url}/rest/agile/1.0/board/1/sprint",
                headers=_jira_headers(),
                params={"state": "active"},
            )
            r.raise_for_status()
            sprints = r.json().get("values", [])
            if not sprints:
                return
            sprint_id = sprints[0]["id"]
            await client.post(
                f"{base_url}/rest/agile/1.0/sprint/{sprint_id}/issue",
                headers=_jira_headers(),
                json={"issues": [issue_key]},
            )
            print(f"  🏃 Added {issue_key} to sprint {sprint_id}")
    except Exception as e:
        print(f"  ⚠️  Sprint assignment failed (non-fatal): {e}")


async def assign_tickets_node(state: AgentState) -> AgentState:
    print("\n👥 NODE: assignTickets — assigning tickets to users...")
    tickets = state.get("tickets") or []

    if not tickets:
        print("  ⚠️  No tickets to assign.")
        return {**state, "assigned_tickets": {}, "current_ticket": None}

    assigned: dict = {}
    for i, ticket in enumerate(tickets):
        user = USERS[i % len(USERS)]
        assigned[ticket["key"]] = user

    current = tickets[0]
    key = current["key"]
    print(f"  ✅ {key} assigned to {assigned[key]}")
    print(f"  🎯 Processing ticket: {key}")

    await _move_to_active_sprint(key)
    await jira_log(key, f"🚀 Pipeline Started — ticket {key} picked up by SMS Agent")

    return {**state, "assigned_tickets": assigned, "current_ticket": current}
