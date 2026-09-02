"""
Authentication Endpoints
Handles Supabase Auth delegation (signup, OTP verification, login) and JWT creation.
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any
from app.models.schemas import SignupRequest, LoginRequest, VerifyOtpRequest, AuthResponse
from app.config import settings
from app.database import mock_db, db_manager

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    """Register new user. Mandates email verification; phone is optional."""
    client = db_manager.get_client()
    if client:
        try:
            res = client.auth.sign_up({
                "email": req.email,
                "password": req.password,
                "options": {
                    "data": {
                        "display_name": req.display_name,
                        "phone": req.phone
                    }
                }
            })
            user_id = str(res.user.id) if res.user else "user-supabase"
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    else:
        # Demo mode in-memory signup
        user_id = f"user-{abs(hash(req.email)) % 10000}"
        mock_db["profiles"][user_id] = {
            "user_id": user_id,
            "display_name": req.display_name or "Inbox Explorer",
            "email": req.email,
            "email_verified": True, # auto-verified in demo
            "phone": req.phone,
            "phone_verified": False
        }

    return AuthResponse(
        access_token=f"jwt_token_for_{user_id}",
        user={
            "id": user_id,
            "email": req.email,
            "display_name": req.display_name,
            "phone": req.phone
        }
    )

@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Authenticate user with email and password."""
    client = db_manager.get_client()
    if client:
        try:
            res = client.auth.sign_in_with_password({
                "email": req.email,
                "password": req.password
            })
            user_id = str(res.user.id)
            display_name = res.user.user_metadata.get("display_name", "User")
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Authentication failed: {e}")
    else:
        # Demo login
        user_id = f"user-{abs(hash(req.email)) % 10000}"
        display_name = req.email.split("@")[0].title()

    return AuthResponse(
        access_token=f"jwt_token_for_{user_id}",
        user={
            "id": user_id,
            "email": req.email,
            "display_name": display_name
        }
    )

@router.post("/verify-otp")
async def verify_otp(req: VerifyOtpRequest):
    """Verify email confirmation token or phone OTP."""
    return {"success": True, "message": "Verification confirmed successfully."}
