import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.api.routes import router as api_router
from backend.app.db import check_db_connection

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AegisSea")

app = FastAPI(
    title="AegisSea Engine API",
    description="AI-Powered SAR Oil Spill Detection & Multi-Signal Vessel Attribution System API",
    version="1.0.0"
)

# CORS middleware for Next.js 15 frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Next.js dev server on port 3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event("startup")
def startup_event():
    logger.info(f"Starting AegisSea Backend Service on port {settings.API_PORT}...")
    logger.info(f"Environment: {settings.FASTAPI_ENV}")
    db_ok = check_db_connection()
    if not db_ok:
        logger.info("[NOTICE] Database ping skipped/failed. FastAPI running in standalone API mode.")

@app.get("/")
def root():
    return {
        "message": "Welcome to AegisSea API — Marine Oil Spill Detection & Vessel Attribution Engine",
        "docs": "/docs",
        "health": "/api/v1/health"
    }
