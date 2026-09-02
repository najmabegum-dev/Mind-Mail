"""
Database and Storage Abstraction Layer
Supports Supabase Postgres client with a seamless in-memory / local fallback for Demo Mode.
"""
from typing import Optional, Dict, Any, List
from app.config import settings

# Global in-memory storage for Demo Mode
mock_db: Dict[str, Any] = {
    "profiles": {},
    "emails": [],
    "usage_logs": [],
    "feedback": [
        {
            "id": "fb-1",
            "user_id": "demo-user-1",
            "message": "Sorted through 8,500 unread emails in under 3 minutes. The narrative summaries are mind-blowing.",
            "rating": 5,
            "is_public": True,
            "created_at": "2026-09-01T12:00:00Z"
        },
        {
            "id": "fb-2",
            "user_id": "demo-user-2",
            "message": "Finally reclaimed 1.4 GB from stale marketing blasts without fearing I'd lose job interview updates.",
            "rating": 5,
            "is_public": True,
            "created_at": "2026-09-02T08:30:00Z"
        }
    ]
}

class SupabaseClientManager:
    def __init__(self):
        self.client = None
        if not settings.DEMO_MODE and settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            try:
                from supabase import create_client
                self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
            except Exception as e:
                print(f"[Supabase] Warning: Could not initialize Supabase client: {e}. Falling back to in-memory store.")

    def get_client(self):
        return self.client

db_manager = SupabaseClientManager()
