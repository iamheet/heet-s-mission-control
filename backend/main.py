import os
import asyncio
import time
from collections import defaultdict

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from engine import jarvis_engine, MODEL_FAST, MODEL_SMART

load_dotenv_done = True  # already handled in engine.py

# ── Config ────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
RATE_LIMIT_RPM  = int(os.getenv("RATE_LIMIT_RPM", "30"))   # requests per minute per IP
MAX_INPUT_LEN   = 500

# ── Rate limiter (in-memory, per IP) ─────────────────────────────────────────
_rate_store: dict[str, list[float]] = defaultdict(list)

def is_rate_limited(ip: str) -> bool:
    now = time.time()
    window = 60.0
    timestamps = [t for t in _rate_store[ip] if now - t < window]
    _rate_store[ip] = timestamps
    if len(timestamps) >= RATE_LIMIT_RPM:
        return True
    _rate_store[ip].append(now)
    return False

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Jarvis Mission Control Backend",
    description="Python backend for Jarvis AI assistant",
    docs_url=None,   # disable Swagger in production
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ── Request model ─────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty.")
        if len(v) > MAX_INPUT_LEN:
            raise ValueError(f"Message too long. Max {MAX_INPUT_LEN} characters.")
        return v

# ── Routes ────────────────────────────────────────────────────────────────────
@app.post("/chat")
async def chat_endpoint(request: Request, body: ChatRequest):
    ip = request.client.host if request.client else "unknown"

    if is_rate_limited(ip):
        raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")

    def generate_response():
        try:
            for token in jarvis_engine.generate_stream(body.message):
                yield token
        except Exception as e:
            print(f"[!] Stream error: {e}")
            yield "\n[JARVIS encountered an internal error. Please try again.]"

    return StreamingResponse(generate_response(), media_type="text/plain")


@app.get("/status")
async def get_status():
    return {
        "status": "active",
        "engine": "hybrid",
        "model_fast": MODEL_FAST,
        "model_smart": MODEL_SMART,
        "gemini_keys_loaded": len([
            k for k in [os.getenv("GEMINI_API_KEY_1"), os.getenv("GEMINI_API_KEY_2")]
            if k and k.strip() not in ("", "your_gemini_api_key_here")
        ]),
        "ready": True,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,  # never True in production
        workers=1,
    )
