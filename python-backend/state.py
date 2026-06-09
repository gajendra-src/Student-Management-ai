from typing import Any, Optional
from typing_extensions import TypedDict


class AgentState(TypedDict, total=False):
    tickets: list[dict]
    assigned_tickets: dict[str, Any]
    current_ticket: Optional[dict]
    plan: Optional[dict]
    generated_files: list[dict]   # [{"path": str, "content": str}]
    test_score: int
    test_issues: list[dict]
    retry_count: int
    deploy_url: Optional[str]
    error: Optional[str]
