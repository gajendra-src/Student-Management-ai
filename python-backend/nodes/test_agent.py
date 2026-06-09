import json
from langchain_openai import ChatOpenAI
from state import AgentState

_llm = None
PASS_THRESHOLD = 80


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
    return _llm


async def test_agent_node(state: AgentState) -> AgentState:
    print("\n🧪 NODE: testAgent — reviewing generated code...")
    generated_files = state.get("generated_files") or []

    if not generated_files:
        print("  ⚠️  No files to test.")
        return {**state, "test_score": 100, "test_issues": []}

    files_content = "\n\n".join(
        f"=== {f['path']} ===\n{f['content']}" for f in generated_files
    )

    prompt = f"""Review these Next.js 14 TypeScript files for correctness.

{files_content}

Check for:
1. Wrong CSS import path (@/styles/globals.css should be ./globals.css in layout.tsx)
2. Nested <a> inside <Link> (wrong in Next.js 13+)
3. <img> tags instead of <Image> from next/image
4. camelCase field names (studentId, courseId) instead of snake_case (student_id, course_id)
5. Non-existent imports (@/lib/api, @/lib/csvParser, @/components/Button, date-fns, @heroicons/react)
6. db.escape() calls (db has no escape method)
7. useRouter from 'next/router' (should be 'next/navigation')
8. TypeScript type errors or missing types
9. Missing 'use client' for hooks, or unnecessary 'use client' on server components

Respond ONLY with valid JSON (no markdown):
{{
  "score": <0-100>,
  "summary": "<one line summary>",
  "issues": [
    {{
      "file": "<path>",
      "line": <approximate line number or 0>,
      "issue": "<description>",
      "fix": "<exact fix to apply>"
    }}
  ]
}}

Score guide: 100=perfect, 80+=minor issues only, <80=has errors that need fixing"""

    try:
        response = await _get_llm().ainvoke(prompt)
        content = response.content.strip()
        for prefix in ["```json", "```"]:
            content = content.removeprefix(prefix)
        content = content.removesuffix("```").strip()
        result = json.loads(content)

        score = result.get("score", 0)
        issues = result.get("issues", [])
        summary = result.get("summary", "")

        status = "✅ PASS" if score >= PASS_THRESHOLD else "❌ FAIL"
        print(f"  {status} Score: {score}/100 — {summary}")
        if issues:
            print(f"  Issues ({len(issues)}):")
            for issue in issues:
                print(f"    - [{issue.get('file', '?')}] {issue.get('issue', '')}")

        return {**state, "test_score": score, "test_issues": issues}
    except Exception as e:
        print(f"  ❌ Test agent failed: {e}")
        return {**state, "test_score": 0, "test_issues": []}
