import json
from langchain_openai import ChatOpenAI
from state import AgentState

_llm = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    return _llm


async def plan_agent_node(state: AgentState) -> AgentState:
    print("\n🧠 NODE: planAgent — planning implementation...")
    ticket = state.get("current_ticket")

    if not ticket:
        print("  ⚠️  No current ticket — skipping.")
        return state

    summary = ticket.get("fields", {}).get("summary", "")
    description = ticket.get("fields", {}).get("description", "") or ""

    prompt = f"""You are a senior software architect planning features for a Next.js 14 student management system.

Ticket: {ticket['key']} — {summary}
Description: {description}

The project has these existing routes and components:
- app/page.tsx (dashboard)
- app/students/page.tsx, app/students/[id]/page.tsx
- app/courses/page.tsx
- app/grades/page.tsx
- app/attendance/page.tsx
- components/DataTable.tsx, components/Navbar.tsx, components/Footer.tsx
- app/api/students/, app/api/courses/, app/api/grades/, app/api/attendance/
- lib/db.ts (getDb returns {{students, courses, grades}})
- lib/attendance.ts (attendanceStore)

Respond with ONLY valid JSON (no markdown):
{{
  "workType": "frontend" | "backend" | "fullstack",
  "files": ["path/to/file1.tsx", "path/to/file2.ts"],
  "description": "brief plan"
}}

Rules:
- "frontend" for UI-only changes (pages, components)
- "backend" for API routes only
- "fullstack" for both
- List only files that need to be CREATED or MODIFIED
- Keep scope minimal — only what the ticket requires"""

    try:
        response = await _get_llm().ainvoke(prompt)
        content = response.content.strip()
        for prefix in ["```json", "```"]:
            content = content.removeprefix(prefix)
        content = content.removesuffix("```").strip()
        plan = json.loads(content)
        print(f"  ✅ Plan: {plan['workType']} — {len(plan.get('files', []))} file(s) to build")
        for f in plan.get("files", []):
            print(f"    - {f}")
        return {**state, "plan": plan}
    except Exception as e:
        print(f"  ❌ Plan failed: {e}")
        fallback = {"workType": "frontend", "files": [], "description": str(e)}
        return {**state, "plan": fallback, "error": str(e)}
