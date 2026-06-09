from langgraph.graph import StateGraph, START, END

from state import AgentState
from nodes.fetch_tickets import fetch_tickets_node
from nodes.assign_tickets import assign_tickets_node
from nodes.plan_agent import plan_agent_node
from nodes.frontend_agent import frontend_agent_node
from nodes.backend_agent import backend_agent_node
from nodes.test_agent import test_agent_node, PASS_THRESHOLD
from nodes.fix_agent import fix_agent_node
from nodes.devops_agent import devops_agent_node

MAX_RETRIES = 3


def route_after_plan(state: AgentState) -> str:
    if not state.get("current_ticket"):
        return "devops"
    work_type = (state.get("plan") or {}).get("workType", "fullstack")
    return "backend" if work_type == "backend" else "frontend"


def route_after_frontend(state: AgentState) -> str:
    work_type = (state.get("plan") or {}).get("workType", "fullstack")
    return "backend" if work_type == "fullstack" else "test"


def route_after_test(state: AgentState) -> str:
    score = state.get("test_score") or 0
    retries = state.get("retry_count") or 0
    if score >= PASS_THRESHOLD:
        return "devops"
    if retries >= MAX_RETRIES:
        print(f"  ⚠️  Max retries ({MAX_RETRIES}) reached — deploying anyway.")
        return "devops"
    return "fix"


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node("fetchTickets", fetch_tickets_node)
    graph.add_node("assignTickets", assign_tickets_node)
    graph.add_node("planAgent", plan_agent_node)
    graph.add_node("frontendAgent", frontend_agent_node)
    graph.add_node("backendAgent", backend_agent_node)
    graph.add_node("testAgent", test_agent_node)
    graph.add_node("fixAgent", fix_agent_node)
    graph.add_node("devopsAgent", devops_agent_node)

    graph.add_edge(START, "fetchTickets")
    graph.add_edge("fetchTickets", "assignTickets")
    graph.add_edge("assignTickets", "planAgent")
    graph.add_conditional_edges("planAgent", route_after_plan,
                                {"frontend": "frontendAgent", "backend": "backendAgent", "devops": "devopsAgent"})
    graph.add_conditional_edges("frontendAgent", route_after_frontend,
                                {"backend": "backendAgent", "test": "testAgent"})
    graph.add_edge("backendAgent", "testAgent")
    graph.add_conditional_edges("testAgent", route_after_test,
                                {"devops": "devopsAgent", "fix": "fixAgent"})
    graph.add_edge("fixAgent", "testAgent")
    graph.add_edge("devopsAgent", END)

    return graph.compile()


compiled_graph = build_graph()


async def run_agent_pipeline() -> dict:
    print("\n" + "═" * 60)
    print("  🤖 SMS Python Agent Pipeline — Starting")
    print("═" * 60)

    initial_state: AgentState = {
        "tickets": [], "assigned_tickets": {}, "current_ticket": None,
        "plan": None, "generated_files": [], "test_score": 0,
        "test_issues": [], "retry_count": 0, "deploy_url": None, "error": None,
    }

    final_state = await compiled_graph.ainvoke(initial_state)

    ticket_key = (final_state.get("current_ticket") or {}).get("key", "none")
    print("\n" + "═" * 60)
    print("  🏁 Pipeline Complete")
    print(f"  Ticket:   {ticket_key}")
    print(f"  Score:    {final_state.get('test_score')}/100")
    print(f"  Deploy:   {final_state.get('deploy_url') or 'n/a'}")
    print(f"  Retries:  {final_state.get('retry_count') or 0}")
    if final_state.get("error"):
        print(f"  Error:    {final_state['error']}")
    print("═" * 60 + "\n")

    return {
        "ticket_key": ticket_key,
        "test_score": final_state.get("test_score"),
        "deploy_url": final_state.get("deploy_url"),
        "retry_count": final_state.get("retry_count") or 0,
        "files_generated": len(final_state.get("generated_files") or []),
        "error": final_state.get("error"),
    }
