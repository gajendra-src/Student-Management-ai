import os
import pathlib
import re
import git as gitpython


def push_to_github(branch_name: str, commit_msg: str, files: list[dict]) -> None:
    repo_url = os.environ["GITHUB_REPO_URL"]
    token = os.environ["GITHUB_TOKEN"]
    project_root = pathlib.Path(__file__).parent.parent.parent

    repo = gitpython.Repo(project_root)

    # Discard tracked changes only (never removes untracked files/dirs)
    repo.git.checkout("-f")

    # Configure git identity
    with repo.config_writer() as cfg:
        cfg.set_value("user", "name", "SMS Agent")
        cfg.set_value("user", "email", "agent@sms.local")

    # Ensure we're on main first
    repo.git.checkout("main")
    repo.git.pull("origin", "main", "--rebase")

    # Delete local feature branch if exists, then recreate from main
    local_branches = [b.name for b in repo.branches]
    if branch_name in local_branches:
        repo.git.branch("-D", branch_name)
    repo.git.checkout("-b", branch_name)

    # Write generated files
    for f in files:
        file_path = project_root / f["path"]
        file_path.parent.mkdir(parents=True, exist_ok=True)
        file_path.write_text(f["content"], encoding="utf-8")
        print(f"  📝 Written: {f['path']}")

    # Stage and commit
    repo.git.add("-A")
    try:
        repo.git.commit("-m", commit_msg)
    except gitpython.exc.GitCommandError as e:
        if "nothing to commit" in str(e):
            print("  ⚠️  Nothing to commit — skipping push.")
            return
        raise

    # Build authenticated URL
    clean_url = re.sub(r"https?://", "", repo_url.rstrip("/"))
    authenticated_url = f"https://{token}@{clean_url}"

    # Force-push with explicit refspec
    print(f"  🌿 Pushing branch: {branch_name} → {branch_name}")
    repo.git.execute(["git", "push", "--force", authenticated_url, f"{branch_name}:{branch_name}"])
