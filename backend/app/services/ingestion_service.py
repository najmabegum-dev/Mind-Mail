"""
Ingestion Service
Manages paginated pulls of email metadata and bodies into database storage.
"""
from typing import List, Dict, Any
from app.config import settings
from app.database import mock_db, db_manager
from app.services.gmail_service import gmail_service

class IngestionService:
    def ingest_emails(self, user_id: str, access_token: str, limit: int = 500) -> List[Dict[str, Any]]:
        """
        Pulls emails from Gmail API (or mock generator in demo mode)
        and persists them to database.
        """
        raw_emails = gmail_service.fetch_emails(access_token=access_token, max_results=limit)
        
        # Associate user_id
        for email in raw_emails:
            email["user_id"] = user_id
            if "body" not in email:
                email["body"] = email.get("snippet", "")

        # Store in database
        client = db_manager.get_client()
        if client:
            try:
                # Upsert into Supabase emails table
                client.table("emails").upsert(raw_emails).execute()
            except Exception as e:
                print(f"[Ingestion] Supabase upsert error: {e}")

        # Store in in-memory store
        mock_db["emails"] = raw_emails
        return raw_emails

ingestion_service = IngestionService()
