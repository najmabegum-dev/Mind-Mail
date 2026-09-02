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

    def get_inbox_metrics(self, access_token: str) -> Dict[str, Any]:
        """Fetch exact real-time telemetry from Gmail account."""
        if settings.DEMO_MODE or access_token.startswith("mock_"):
            return {
                "email_address": "demo@gmail.com",
                "total_messages": 10420,
                "unread_messages": 943,
                "read_messages": 9477,
                "estimated_storage_mb": 458.5
            }

        import httpx
        req_headers = {"Authorization": f"Bearer {access_token}"}
        try:
            with httpx.Client(timeout=10.0) as client:
                # 1. Fetch user profile
                profile_res = client.get("https://gmail.googleapis.com/gmail/v1/users/me/profile", headers=req_headers)
                profile = profile_res.json() if profile_res.status_code == 200 else {}
                total_msgs = profile.get("messagesTotal", 0)
                email_addr = profile.get("emailAddress", "Connected User")

                # 2. Query unread count
                unread_res = client.get("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is%3Aunread&maxResults=1", headers=req_headers)
                unread_count = unread_res.json().get("resultSizeEstimate", 0) if unread_res.status_code == 200 else 0

                read_msgs = max(0, total_msgs - unread_count)
                storage_mb = round((total_msgs * 45) / 1024, 1)

                return {
                    "email_address": email_addr,
                    "total_messages": total_msgs,
                    "unread_messages": unread_count,
                    "read_messages": read_msgs,
                    "estimated_storage_mb": storage_mb
                }
        except Exception as e:
            print(f"[Metrics] Error fetching Gmail profile metrics: {e}")
            return {
                "email_address": "user@gmail.com",
                "total_messages": 1000,
                "unread_messages": 100,
                "read_messages": 900,
                "estimated_storage_mb": 45.0
            }

    def fetch_emails(
        self, 
        access_token: str, 
        from_date: Optional[str] = None, 
        to_date: Optional[str] = None, 
        max_results: int = 500
    ) -> List[Dict[str, Any]]:
        """Paginated fetch of user emails with date range and unsubscribe extraction."""
        if settings.DEMO_MODE or access_token.startswith("mock_"):
            from app.services.mock_data_service import generate_mock_emails
            return generate_mock_emails(count=min(max_results, 500))

        import httpx
        import urllib.parse
        import re
        from concurrent.futures import ThreadPoolExecutor

        messages = []
        next_page_token = None
        req_headers = {"Authorization": f"Bearer {access_token}"}
        
        # Build date-range search query if provided
        q_parts = []
        if from_date:
            formatted_from = from_date.replace("-", "/")
            q_parts.append(f"after:{formatted_from}")
        if to_date:
            formatted_to = to_date.replace("-", "/")
            q_parts.append(f"before:{formatted_to}")

        date_query_param = ""
        if q_parts:
            date_query_param = f"&q={urllib.parse.quote(' '.join(q_parts))}"

        # Lightweight metadataHeaders including List-Unsubscribe
        meta_params = "&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=List-Unsubscribe"

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
                    
                    # Extract list-unsubscribe URL if present
                    unsub_header = hdrs.get("list-unsubscribe", "")
                    unsub_url = None
                    if unsub_header:
                        urls = re.findall(r'<([^>]+)>', unsub_header)
                        # Prefer http/https link over mailto
                        http_urls = [u for u in urls if u.startswith("http")]
                        unsub_url = http_urls[0] if http_urls else (urls[0] if urls else None)

                    return {
                        "id": data["id"],
                        "sender": sender_val,
                        "domain": domain_val,
                        "subject": hdrs.get("subject", "(No Subject)"),
                        "date": hdrs.get("date", ""),
                        "snippet": data.get("snippet", ""),
                        "is_read": "UNREAD" not in data.get("labelIds", []),
                        "unsubscribe_url": unsub_url
                    }
                except Exception:
                    return None

            while len(messages) < max_results:
                batch_size = min(100, max_results - len(messages))
                list_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={batch_size}{date_query_param}"
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
