"""
FastAPI Application Entry Point
Orchestrates REST API endpoints, CORS middleware, and background agent jobs.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api import auth, gmail, scan, categories, actions, feedback

app = FastAPI(
    title=f"{settings.PROJECT_NAME} Backend",
    description="AI Multi-Agent Gmail Sorting & Cleanup Assistant API",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for seamless development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(gmail.router)
app.include_router(scan.router)
app.include_router(categories.router)
app.include_router(actions.router)
app.include_router(feedback.router)

@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "status": "running",
        "mode": "demo" if settings.DEMO_MODE else "production",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
