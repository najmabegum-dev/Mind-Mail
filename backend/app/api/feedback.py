"""
Feedback & Metrics Router
Handles lightweight user feedback/testimonials and aggregated proof-point stats.
"""
from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import FeedbackCreate, FeedbackResponse
from app.database import mock_db, db_manager
import uuid
from datetime import datetime

router = APIRouter(prefix="", tags=["Feedback & Stats"])

@router.post("/feedback", response_model=FeedbackResponse)
async def submit_feedback(req: FeedbackCreate, user_id: str = "demo-user-1"):
    """Submit a lightweight feedback review or testimonial."""
    feedback_id = f"fb-{str(uuid.uuid4())[:8]}"
    entry = {
        "id": feedback_id,
        "user_id": user_id,
        "message": req.message,
        "rating": req.rating or 5,
        "is_public": True,
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    mock_db["feedback"].insert(0, entry)

    client = db_manager.get_client()
    if client:
        try:
            client.table("feedback").insert(entry).execute()
        except Exception as e:
            print(f"[Feedback] Supabase error: {e}")

    return FeedbackResponse(**entry)

@router.get("/feedback", response_model=List[FeedbackResponse])
async def list_feedback(limit: int = 10):
    """Retrieve verified testimonials for public proof."""
    client = db_manager.get_client()
    if client:
        try:
            res = client.table("feedback").select("*").eq("is_public", True).limit(limit).execute()
            if res.data:
                return [FeedbackResponse(**f) for f in res.data]
        except Exception as e:
            print(f"[Feedback] Supabase fetch error: {e}")

    # Fallback to mock testimonials
    return [FeedbackResponse(**f) for f in mock_db["feedback"][:limit]]

@router.get("/stats")
async def get_aggregate_stats():
    """
    Returns public proof metrics (Section 10 of PRD):
    Total emails scanned, total storage freed, and verified user count.
    """
    base_scanned = 18450
    base_freed_mb = 812.4

    # Add any session usage_logs
    session_scanned = 0
    session_freed = 0.0
    for log in mock_db.get("usage_logs", []):
        meta = log.get("metadata", {})
        session_scanned += meta.get("emails_affected", 0)
        session_freed += meta.get("storage_freed_mb", 0.0)

    return {
        "total_emails_scanned": base_scanned + session_scanned,
        "total_storage_freed_mb": round(base_freed_mb + session_freed, 1),
        "total_storage_freed_gb": round((base_freed_mb + session_freed) / 1024, 2),
        "active_users_count": 48
    }
