"""
Google Gmail API & OAuth Integration Service
Handles OAuth 2.0 authorization, token exchange, message retrieval, and modification.
"""
from typing import List, Dict, Any, Optional
from app.config import settings

SCOPES_READONLY = ["https://www.googleapis.com/auth/gmail.readonly"]
SCOPES_MODIFY = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify"
]

class GmailService:
    @property
    def client_id(self):
        return settings.GOOGLE_CLIENT_ID

    @property
    def client_secret(self):
        return settings.GOOGLE_CLIENT_SECRET

    @property
    def redirect_uri(self):
        return settings.GOOGLE_REDIRECT_URI

    def get_auth_url(self, state: str = "default_state", write_access: bool = False) -> str:
        """Generate Google OAuth 2.0 consent URL."""
        if settings.DEMO_MODE or not self.client_id:
            return f"http://localhost:5173/dashboard?mock_auth=success&state={state}"

        scopes = SCOPES_MODIFY if write_access else SCOPES_READONLY
        scope_str = "%20".join(scopes)
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={self.client_id}&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_type=code&"
            f"scope={scope_str}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={state}"
        )

    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access & refresh tokens."""
        if settings.DEMO_MODE or not self.client_id:
            return {
                "access_token": "mock_gmail_access_token_12345",
                "refresh_token": "mock_gmail_refresh_token_67890",
                "expires_in": 3600,
                "token_type": "Bearer"
            }

        import httpx
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "redirect_uri": self.redirect_uri,
            "grant_type": "authorization_code",
        }
        resp = httpx.post(token_url, data=data)
        resp.raise_for_status()
        return resp.json()

    def fetch_emails(self, access_token: str, max_results: int = 500) -> List[Dict[str, Any]]:
        """Paginated, ultra-fast fetch of user emails from Gmail API."""
        if settings.DEMO_MODE or access_token.startswith("mock_"):
            from app.services.mock_data_service import generate_mock_emails
            return generate_mock_emails(count=min(max_results, 500))

        import httpx
        from concurrent.futures import ThreadPoolExecutor

        messages = []
        next_page_token = None
        req_headers = {"Authorization": f"Bearer {access_token}"}
        
        # Use lightweight metadataHeaders to minimize payload size and latency
        meta_params = "&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date"

        with httpx.Client(timeout=15.0) as client:
            def fetch_single_msg(item_id: str) -> Optional[Dict[str, Any]]:
                try:
                    url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{item_id}?format=metadata{meta_params}"
                    r = client.get(url, headers=req_headers)
                    if r.status_code != 200:
                        return None
                    data = r.json()
                    hdrs = {h["name"].lower(): h["value"] for h in data.get("payload", {}).get("headers", [])}
                    sender_val = hdrs.get("from", "Unknown")
                    domain_val = sender_val.split("@")[-1].replace(">", "").strip() if "@" in sender_val else "unknown"
                    return {
                        "id": data["id"],
                        "sender": sender_val,
                        "domain": domain_val,
                        "subject": hdrs.get("subject", "(No Subject)"),
                        "date": hdrs.get("date", ""),
                        "snippet": data.get("snippet", ""),
                        "is_read": "UNREAD" not in data.get("labelIds", [])
                    }
                except Exception:
                    return None

            while len(messages) < max_results:
                batch_size = min(100, max_results - len(messages))
                list_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={batch_size}"
                if next_page_token:
                    list_url += f"&pageToken={next_page_token}"
                
                list_resp = client.get(list_url, headers=req_headers)
                if list_resp.status_code != 200:
                    break
                results = list_resp.json()
                msg_items = results.get("messages", [])
                if not msg_items:
                    break
                msg_ids = [m["id"] for m in msg_items]

                # Fetch details concurrently across 20 threads
                with ThreadPoolExecutor(max_workers=20) as executor:
                    fetched_items = list(executor.map(fetch_single_msg, msg_ids))
                    for item in fetched_items:
                        if item:
                            messages.append(item)
                
                next_page_token = results.get("nextPageToken")
                if not next_page_token:
                    break

        return messages

    def execute_batch_action(self, access_token: str, message_ids: List[str], action: str) -> bool:
        """Batch archive or trash messages on Gmail API."""
        if settings.DEMO_MODE or access_token.startswith("mock_"):
            return True

        from googleapiclient.discovery import build
        from google.oauth2.credentials import Credentials

        creds = Credentials(token=access_token)
        service = build("gmail", "v1", credentials=creds)

        if action == "archive":
            # Archive = remove INBOX label
            service.users().messages().batchModify(
                userId="me",
                body={"ids": message_ids, "removeLabelIds": ["INBOX"]}
            ).execute()
        elif action == "delete":
            # Move to Trash (30-day recovery bin in Gmail)
            for msg_id in message_ids:
                service.users().messages().trash(userId="me", id=msg_id).execute()

        return True

gmail_service = GmailService()
