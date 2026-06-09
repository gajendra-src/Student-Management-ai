import asyncio
from langchain_openai import ChatOpenAI
from state import AgentState
from tools.logger import jira_log

_llm = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
    return _llm


async def fix_agent_node(state: AgentState) -> AgentState:
    retry_count = state.get("retry_count") or 0
    attempt = retry_count + 1
    print(f"\n🔧 NODE: fixAgent — fixing issues (attempt {attempt}/3)...")

    key = (state.get("current_ticket") or {}).get("key")
    test_issues = state.get("test_issues") or []
    generated_files = list(state.get("generated_files") or [])

    await jira_log(key, f"🔧 FixAgent Started — Retry #{attempt}/3\nFixing {len(test_issues)} issue(s)")

    if not test_issues:
        print("  ✅ No issues to fix.")
        return {**state, "retry_count": attempt}

    issues_by_file: dict[str, list] = {}
    for issue in test_issues:
        issues_by_file.setdefault(issue.get("file", ""), []).append(issue)

    new_files = list(generated_files)

    for file_path, issues in issues_by_file.items():
        original = next((f for f in new_files if f["path"] == file_path), None)
        if not original:
            print(f"  ⚠️  File not found: {file_path}")
            continue

        print(f"  🔨 Fixing: {file_path} ({len(issues)} issue(s))")
        issue_list = "\n".join(
            f"- Line ~{i.get('line', '?')}: {i.get('issue', '')}\n  Fix: {i.get('fix', '')}"
            for i in issues
        )

        prompt = f"""Fix these issues in this TypeScript/Next.js file.

File: {file_path}

Current content:
```
{original['content']}
```

Issues to fix:
{issue_list}

IMPORTANT RULES:
- CSS import in layout.tsx MUST be './globals.css' not '@/styles/globals.css'
- Link children must NOT be <a> tags — put className directly on <Link>
- Use <Image> from 'next/image' not <img>
- snake_case: student_id, course_id (never studentId, courseId)
- Never import from @/lib/api, @/lib/csvParser, @/components/Button
- Never call db.escape()

Return ONLY the complete corrected file content. No markdown code blocks."""

        try:
            response = await _get_llm().ainvoke(prompt)
            fixed = response.content.strip()
            for prefix in ["```tsx", "```ts", "```typescript", "```"]:
                fixed = fixed.removeprefix(prefix)
            fixed = fixed.removesuffix("```").strip()
            idx = next(i for i, f in enumerate(new_files) if f["path"] == file_path)
            new_files[idx] = {"path": file_path, "content": fixed}
            print(f"  ✅ Fixed: {file_path}")
            await asyncio.sleep(1)
        except Exception as e:
            print(f"  ❌ Failed to fix {file_path}: {e}")

    fixed_paths = list(issues_by_file.keys())
    await jira_log(key, f"🔧 FixAgent Completed — Retry #{attempt}\nFixed files: {', '.join(fixed_paths)}")
    return {**state, "generated_files": new_files, "retry_count": attempt}
