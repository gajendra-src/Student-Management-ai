import asyncio
import pathlib
import subprocess

from langchain_openai import ChatOpenAI
from tools.github_tool import push_to_github
from tools.vercel import trigger_deploy, get_latest_deploy_url
from tools.jira import post_comment, close_ticket
from state import AgentState

_llm = None
MAX_BUILD_RETRIES = 2
PROJECT_ROOT = pathlib.Path(__file__).parent.parent.parent


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(model="gpt-4o", temperature=0.1)
    return _llm


def _write_files(files: list[dict]) -> None:
    for f in files:
        file_path = PROJECT_ROOT / f["path"]
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(f["content"], encoding="utf-8")
        print(f"  📝 Written: {f['path']}")


def _run_tsc() -> list[str]:
    """Run tsc --noEmit and return list of error lines (empty = success)."""
    result = subprocess.run(
        ["npx", "tsc", "--noEmit"],
        cwd=str(PROJECT_ROOT),
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode == 0:
        return []
    errors = []
    for line in (result.stdout + result.stderr).splitlines():
        line = line.strip()
        if line and ("error TS" in line or "Cannot find" in line or "Module not found" in line):
            errors.append(line)
    return errors or [(result.stdout + result.stderr).strip()]


async def _fix_build_errors(files: list[dict], errors: list[str]) -> list[dict]:
    """Ask LLM to fix TypeScript build errors in generated files."""
    error_text = "\n".join(errors[:30])
    files_content = "\n\n".join(
        f"=== {f['path']} ===\n{f['content']}" for f in files
    )

    prompt = f"""Fix the TypeScript build errors in these Next.js 14 files.

Build errors:
{error_text}

Current files:
{files_content}

CRITICAL RULES:
- CSS import in app/layout.tsx: use './globals.css' (relative), NEVER '@/styles/globals.css'
- Link children: <Link href="..." className="...">Text</Link> — no nested <a> tags
- Images: <Image> from 'next/image', never bare <img>
- snake_case fields: student_id, course_id (never studentId, courseId)
- Forbidden imports: @/lib/api, @/lib/csvParser, @/components/Button, date-fns, @heroicons/react
- db has NO .escape() method

Return ONLY a JSON array of fixed files (no markdown):
[{{"path": "...", "content": "..."}}]"""

    try:
        response = await _get_llm().ainvoke(prompt)
        content = response.content.strip()
        for prefix in ["```json", "```"]:
            content = content.removeprefix(prefix)
        content = content.removesuffix("```").strip()

        fixed_list = __import__("json").loads(content)
        fixed_map = {f["path"]: f for f in files}
        for fixed in fixed_list:
            if fixed.get("path") in fixed_map:
                fixed_map[fixed["path"]] = fixed
        return list(fixed_map.values())
    except Exception as e:
        print(f"  ❌ LLM fix failed: {e}")
        return files


async def devops_agent_node(state: AgentState) -> AgentState:
    print("\n🚀 NODE: devopsAgent — verifying build and deploying...")
    ticket = state.get("current_ticket")
    generated_files = state.get("generated_files") or []
    test_score = state.get("test_score") or 0

    if not ticket:
        print("  ⚠️  No current ticket — skipping deploy.")
        return state

    if not generated_files:
        print("  ⚠️  No files — closing ticket anyway.")
        await _close_safely(ticket["key"], None, None, test_score)
        return {**state, "deploy_url": None}

    key = ticket["key"]
    summary = ticket.get("fields", {}).get("summary", key)
    commit_msg = f"feat({key}): {summary}"

    # ── STEP 1: Write files to disk ──────────────────────────────────
    _write_files(generated_files)

    # ── STEP 2: TypeScript build check (with auto-fix loop) ──────────
    build_errors = _run_tsc()
    build_attempt = 0

    while build_errors and build_attempt < MAX_BUILD_RETRIES:
        build_attempt += 1
        print(f"\n  ❌ Build check FAILED (attempt {build_attempt}/{MAX_BUILD_RETRIES}):")
        for err in build_errors[:5]:
            print(f"     {err}")
        print(f"  🔧 Auto-fixing {len(build_errors)} build error(s)...")

        generated_files = await _fix_build_errors(generated_files, build_errors)
        _write_files(generated_files)

        await asyncio.sleep(1)
        build_errors = _run_tsc()

    if build_errors:
        print(f"\n  ❌ Build still failing after {MAX_BUILD_RETRIES} fix attempts — aborting push.")
        for err in build_errors[:5]:
            print(f"     {err}")
        await _close_safely(key, None, f"Build failed after {MAX_BUILD_RETRIES} fix attempts: {build_errors[0]}", test_score)
        return {**state, "deploy_url": None, "error": f"Build failed: {build_errors[0]}",
                "generated_files": generated_files}
    else:
        print("  ✅ Build check PASSED — pushing to main...")

    # ── STEP 3: Commit and push directly to main ──────────────────────
    try:
        push_to_github(commit_msg, generated_files)
        print(f"  ✅ Pushed commit to main: {commit_msg[:60]}")
    except Exception as e:
        print(f"  ❌ GitHub push failed: {e}")
        await _close_safely(key, None, f"Deploy failed (git push): {e}", test_score)
        return {**state, "deploy_url": None, "error": str(e)}

    # ── STEP 4: Vercel deploys automatically from main push ───────────
    deploy_url: str | None = None
    try:
        await asyncio.sleep(3)  # give Vercel a moment to pick up the push
        deploy_url = await get_latest_deploy_url()
        if deploy_url:
            print(f"  ✅ Vercel deploy triggered: {deploy_url}")
    except Exception as e:
        print(f"  ⚠️  Could not fetch Vercel URL: {e}")

    # ── STEP 5: Close Jira ticket ─────────────────────────────────────
    await _close_safely(key, deploy_url, None, test_score)
    return {**state, "deploy_url": deploy_url, "generated_files": generated_files}


async def _close_safely(key: str, deploy_url: str | None, error_msg: str | None, test_score: int) -> None:
    try:
        lines = [f"✅ SMS Agent completed ticket {key}", f"Test score: {test_score}/100"]
        if deploy_url:
            lines.append(f"🌐 Live URL: {deploy_url}")
        if error_msg:
            lines.append(f"⚠️ Note: {error_msg}")
        await post_comment(key, "\n".join(lines))
        await close_ticket(key)
        print(f"  ✅ Jira ticket {key} closed")
    except Exception as e:
        print(f"  ❌ Failed to close Jira ticket {key}: {e}")
