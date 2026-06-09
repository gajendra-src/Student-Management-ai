import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from graph import run_agent_pipeline

router = APIRouter(prefix="/api/agent", tags=["agent"])


class TriggerRequest(BaseModel):
    source: str = "manual"


@router.post("/trigger")
async def trigger_pipeline(body: TriggerRequest = TriggerRequest()):
    run_id = str(uuid.uuid4())
    triggered_at = datetime.now(timezone.utc).isoformat()
    print(f"\n🚀 Agent trigger received — source: {body.source}, run: {run_id}")
    try:
        result = await run_agent_pipeline()
        return JSONResponse(content={"success": True, "run_id": run_id,
                                     "triggered_at": triggered_at, "source": body.source, "result": result})
    except Exception as e:
        return JSONResponse(status_code=500,
                            content={"success": False, "run_id": run_id,
                                     "triggered_at": triggered_at, "error": str(e)})


@router.get("/health")
async def health():
    return {"status": "ok", "service": "SMS Python Agent"}
