import os
import time
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from cache import TTLCache

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_PATH = os.path.join(DATA_DIR, "messages.db")
START_TIME = time.monotonic()
stats_cache = TTLCache(ttl_seconds=30.0, max_size=16)


def init_db():
    os.makedirs(DATA_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            name TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """
    )
    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="Interactive Terminal Web API",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow CORS for dev mode and external origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MessageCreate(BaseModel):
    ip: Optional[str] = None
    name: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, max_length=2000)
    timestamp: Optional[str] = None


class MessageResponse(BaseModel):
    status: str
    message: str


@app.get("/")
@app.get("/api")
async def root():
    return {
        "service": "Interactive Terminal Web API",
        "version": "1.0.0",
        "status": "healthy",
        "endpoints": {
            "messages": "/api/messages",
            "stats": "/api/stats",
            "health": "/api/health",
            "docs": "/docs",
        },
    }


@app.post("/api/messages", response_model=MessageResponse)
async def create_message(payload: MessageCreate, request: Request):
    try:
        # Determine IP address
        client_ip = payload.ip
        if not client_ip:
            # Check forwarded headers first (from Nginx proxy)
            forwarded = request.headers.get("X-Forwarded-For")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()
            elif request.client:
                client_ip = request.client.host
            else:
                client_ip = "unknown"

        ts = payload.timestamp or datetime.now(timezone.utc).isoformat()

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO messages (ip, name, content, timestamp)
            VALUES (?, ?, ?, ?)
        """,
            (client_ip, payload.name, payload.content, ts),
        )
        conn.commit()
        conn.close()

        # Invalidate stats cache since a new message arrived
        stats_cache.invalidate("stats")

        return MessageResponse(
            status="SUCCESS",
            message="Your message has been delivered safely to the server!",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/stats")
async def get_stats():
    cached = stats_cache.get("stats")
    if cached is not None:
        return cached

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM messages")
        row = cursor.fetchone()
        total_messages = row[0] if row else 0
        conn.close()

        data = {
            "total_messages": total_messages,
            "cache_status": "active",
            "uptime_seconds": round(time.monotonic() - START_TIME, 2),
        }
        stats_cache.set("stats", data)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}
