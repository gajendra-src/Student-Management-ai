import asyncio
from langchain_openai import ChatOpenAI
from state import AgentState
from tools.logger import jira_log

_llm = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    return _llm


BACKEND_PROMPT = """You are an expert Next.js 14 API route developer. Generate production-ready TypeScript.

RULES — MUST FOLLOW:
1. Always import getDb: `import { getDb } from '@/lib/db'`
2. EXACT data model — snake_case ONLY:
   - Student: { id: string, name: string, email: string, age: number, created_at: string }
   - Course: { id: string, name: string, description: string, credits: number, created_at: string }
   - Grade: { id: string, student_id: string, course_id: string, grade: string, score: number, semester: string, created_at: string }
   CRITICAL: student_id (NOT studentId), course_id (NOT courseId) — camelCase is WRONG
3. db.grades.create() requires: { student_id, course_id, grade, score, semester }
4. db has NO .escape() method — NEVER call db.escape()
5. getDb() returns: { students, courses, grades } — no other tables exist
6. For attendance: import { attendanceStore } from '@/lib/attendance'
7. Next.js 14 route format:
   export async function GET(request: Request) { ... }
   export async function POST(request: Request) { ... }
8. Return NextResponse.json(data) for responses
9. Return ONLY the file content — no markdown, no explanations
"""


async def _generate_file(file_path: str, ticket_summary: str, plan_desc: str) -> dict | None:
    prompt = f"""{BACKEND_PROMPT}

Ticket: {ticket_summary}
Plan: {plan_desc}

Generate the file: {file_path}"""

    try:
        response = await _get_llm().ainvoke(prompt)
        content = response.content.strip()
        for prefix in ["```typescript", "```ts", "```"]:
            content = content.removeprefix(prefix)
        content = content.removesuffix("```").strip()
        print(f"  ✅ Generated: {file_path} ({len(content)} chars)")
        return {"path": file_path, "content": content}
    except Exception as e:
        print(f"  ❌ Failed to generate {file_path}: {e}")
        return None


async def backend_agent_node(state: AgentState) -> AgentState:
    print("\n⚙️  NODE: backendAgent — generating backend files...")
    ticket = state.get("current_ticket") or {}
    plan = state.get("plan") or {}

    summary = ticket.get("fields", {}).get("summary", "")
    plan_desc = plan.get("description", "")
    work_type = plan.get("workType", "fullstack")

    all_files = plan.get("files", [])
    backend_files = [
        f for f in all_files if f.startswith("app/api/")
    ] if work_type == "fullstack" else all_files

    if not backend_files:
        print("  ⚠️  No backend files to generate.")
        return state

    key = (ticket or {}).get("key")
    await jira_log(key, f"⚙️ BackendAgent Started\nFiles: {', '.join(backend_files)}")

    tasks = []
    for f in backend_files:
        print(f"  🔨 Generating: {f}")
        tasks.append(_generate_file(f, summary, plan_desc))
        await asyncio.sleep(0.5)

    results = await asyncio.gather(*tasks)
    new_files = [r for r in results if r is not None]
    existing = list(state.get("generated_files") or [])
    merged = {f["path"]: f for f in existing}
    for f in new_files:
        merged[f["path"]] = f

    await jira_log(key, f"⚙️ BackendAgent Completed\nGenerated: {', '.join(f['path'] for f in new_files)}")
    return {**state, "generated_files": list(merged.values())}
