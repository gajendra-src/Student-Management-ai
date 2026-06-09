from state import AgentState

USERS = ["user1", "user2", "user3"]


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

    # Pick the first ticket to process
    current = tickets[0]
    print(f"  ✅ {current['key']} assigned to {assigned[current['key']]}")
    print(f"  🎯 Processing ticket: {current['key']}")

    return {**state, "assigned_tickets": assigned, "current_ticket": current}
