from tools.jira import fetch_todo_tickets
from state import AgentState


async def fetch_tickets_node(state: AgentState) -> AgentState:
    print("\n📋 NODE: fetchTickets — fetching TODO tickets from Jira...")
    try:
        tickets = await fetch_todo_tickets()
        print(f"  ✅ Found {len(tickets)} ticket(s)")
        for t in tickets:
            print(f"    - {t['key']}: {t['fields']['summary']}")
        return {**state, "tickets": tickets}
    except Exception as e:
        print(f"  ❌ Failed to fetch tickets: {e}")
        return {**state, "tickets": [], "error": str(e)}
