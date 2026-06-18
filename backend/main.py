cdimport os
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine import jarvis_engine, MODEL_FAST, MODEL_SMART
import asyncio

app = FastAPI(
    title="Jarvis Mission Control Backend",
    description="Python backend for high-performance local AI assistant"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Credentials can't be used with "*"
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint returning a streaming response for low-latency feedback.
    """
    print(f"[*] Received message: {request.message}")
    
    async def generate_response():
        try:
            for token in jarvis_engine.generate_stream(request.message):
                yield token
                await asyncio.sleep(0.005)
        except Exception as e:
            yield f"[Backend Error]: {str(e)}"

    return StreamingResponse(
        generate_response(),
        media_type="text/plain"
    )


@app.get("/status")
async def get_status():
    return {
        "status": "active",
        "engine": "ollama",
        "model_fast": MODEL_FAST,
        "model_smart": MODEL_SMART,
        "ready": True,
    }


if __name__ == "__main__":
    import uvicorn
    # Defaulting to 8000 for FastAPI
    uvicorn.run(app, host="0.0.0.0", port=8000)
