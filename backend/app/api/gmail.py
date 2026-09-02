"""
Gmail OAuth Endpoints
Generates authorization consent URLs and exchanges authorization codes for tokens.
"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import RedirectResponse
from app.services.gmail_service import gmail_service
from app.config import settings

router = APIRouter(prefix="", tags=["Gmail OAuth"])

@router.get("/connect-gmail")
async def connect_gmail(state: str = "default_session", write_access: bool = False):
    """
    Returns the Google OAuth 2.0 consent URL.
    Starts with read-only scope (gmail.readonly).
    """
    auth_url = gmail_service.get_auth_url(state=state, write_access=write_access)
    return {
        "auth_url": auth_url,
        "mode": "demo" if settings.DEMO_MODE or not settings.GOOGLE_CLIENT_ID else "live"
    }

@router.get("/oauth/callback")
async def oauth_callback(code: str = Query(None), state: str = Query(""), error: str = Query(None)):
    """
    OAuth2 callback from Google consent screen.
    Exchanges code for tokens and redirects to dashboard with status.
    """
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth Error: {error}")

    from app.database import mock_db
    tokens = gmail_service.exchange_code_for_tokens(code or "mock_code")
    access_token = tokens.get("access_token")
    if access_token:
        mock_db["latest_gmail_token"] = access_token
    # Redirect user back to frontend dashboard
    redirect_target = f"http://localhost:5173/dashboard?connected=true&token={access_token}"
    return RedirectResponse(url=redirect_target)
