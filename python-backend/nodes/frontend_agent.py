import asyncio
from langchain_openai import ChatOpenAI
from state import AgentState

_llm = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
    return _llm


FRONTEND_PROMPT = """You are an expert Next.js 14 developer. Generate production-ready TypeScript code.

RULES — MUST FOLLOW:
1. Use 'use client' ONLY for components that use hooks (useState, useEffect, useRouter, etc.)
   Server components and pages that just fetch data do NOT need 'use client'
2. CSS import in layout: use './globals.css' (relative), never '@/styles/globals.css'
3. DataTable import: `import DataTable from '@/components/DataTable'`
   columns type: Array<{{ key: string; label: string; render?: (value: any, row: any) => React.ReactNode }}>
   NOT plain strings — always objects with key and label
4. Link component: <Link href="/path" className="...">Text</Link>
   NEVER nest <a> inside <Link>
5. Images: use <Image> from 'next/image', never bare <img> tags
6. Router: import from 'next/navigation' (not 'next/router')
7. FORBIDDEN imports — these do not exist:
   - '@/lib/api'
   - '@/lib/csvParser'
   - '@/components/Button'
   - '../utils/gradesUtils'
   - 'date-fns'
   - '@heroicons/react'
   - '@headlessui/react'
8. Available imports:
   - `import {{ getDb }} from '@/lib/db'` — server components only
   - `import {{ attendanceStore }} from '@/lib/attendance'` — for attendance data
   - Tailwind CSS classes for all styling
9. Return ONLY the file content — no markdown code blocks, no explanations

Project data model:
- Student: {{ id, name, email, age, created_at }}
- Course: {{ id, name, description, credits, created_at }}
- Grade: {{ id, student_id, course_id, grade, score, semester, created_at }}
  CRITICAL: student_id (NOT studentId), course_id (NOT courseId)
- getDb() returns: {{ students, courses, grades }} — no other tables
"""


async def _generate_file(file_path: str, ticket_summary: str, plan_desc: str) -> dict | None:
    prompt = f"""{FRONTEND_PROMPT}

Ticket: {ticket_summary}
Plan: {plan_desc}

Generate the file: {file_path}"""

    try:
        response = await _get_llm().ainvoke(prompt)
        content = response.content.strip()
        for prefix in ["```tsx", "```ts", "```typescript", "```"]:
            content = content.removeprefix(prefix)
        content = content.removesuffix("```").strip()
        print(f"  ✅ Generated: {file_path} ({len(content)} chars)")
        return {"path": file_path, "content": content}
    except Exception as e:
        print(f"  ❌ Failed to generate {file_path}: {e}")
        return None


async def frontend_agent_node(state: AgentState) -> AgentState:
    print("\n🎨 NODE: frontendAgent — generating frontend files...")
    ticket = state.get("current_ticket") or {}
    plan = state.get("plan") or {}

    summary = ticket.get("fields", {}).get("summary", "")
    plan_desc = plan.get("description", "")
    work_type = plan.get("workType", "fullstack")

    # Only generate frontend files
    all_files = plan.get("files", [])
    frontend_files = [
        f for f in all_files
        if any(f.startswith(p) for p in ["app/", "components/", "pages/"])
        and not f.startswith("app/api/")
    ] if work_type == "fullstack" else all_files

    if not frontend_files:
        print("  ⚠️  No frontend files to generate.")
        return state

    tasks = []
    for f in frontend_files:
        print(f"  🔨 Generating: {f}")
        tasks.append(_generate_file(f, summary, plan_desc))
        await asyncio.sleep(0.5)

    results = await asyncio.gather(*tasks)
    new_files = [r for r in results if r is not None]
    existing = list(state.get("generated_files") or [])
    merged = {f["path"]: f for f in existing}
    for f in new_files:
        merged[f["path"]] = f

    return {**state, "generated_files": list(merged.values())}
