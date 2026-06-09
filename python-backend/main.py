import pathlib
from dotenv import load_dotenv

# Load .env.local from project root (parent of python-backend/)
load_dotenv(pathlib.Path(__file__).parent.parent / ".env.local")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.agent import router as agent_router

app = FastAPI(title="SMS Python Agent", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3002",
                   "https://student-management-ai-wpx8.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router)


@app.get("/")
async def root():
    return {"message": "SMS Python Agent is running", "docs": "/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
