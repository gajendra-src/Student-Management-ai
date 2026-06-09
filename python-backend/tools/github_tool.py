import os
import pathlib
import re
import git as gitpython

PROJECT_ROOT = pathlib.Path(__file__).parent.parent.parent


def push_to_github(commit_msg: str, files: list[dict]) -> None:
    """Write files, commit to main, and push — no feature branches."""
    repo_url = os.environ["GITHUB_REPO_URL"]
    token = os.environ["GITHUB_TOKEN"]

    repo = gitpython.Repo(PROJECT_ROOT)

    # Discard any tracked dirty state (never removes untracked files/dirs)
    repo.git.checkout("-f")

    # Configure git identity
    with repo.config_writer() as cfg:
        cfg.set_value("user", "name", "SMS Agent")
        cfg.set_value("user", "email", "agent@sms.local")

    # Make sure we're on main and up to date
    repo.git.checkout("main")
    repo.git.pull("origin", "main", "--rebase")

    # Write generated files
    for f in files:
        file_path = PROJECT_ROOT / f["path"]
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

    # Build authenticated URL and push to main
    clean_url = re.sub(r"https?://", "", repo_url.rstrip("/"))
    authenticated_url = f"https://{token}@{clean_url}"

    print(f"  🌿 Pushing commit to main: {commit_msg[:60]}")
    repo.git.execute(["git", "push", authenticated_url, "main:main"])
