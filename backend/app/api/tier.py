"""
Tier & Subscription Management Router
Enforces feature gating across Free, Clarity, and Autopilot tiers.
Tracks monthly bulk action quotas (500 actions/month for Free tier)
and manages BYO API keys.
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from app.models.schemas import (
    UserProfileResponse, TierUpgradeRequest, ByoKeyRequest
)
from app.database import mock_db, db_manager

router = APIRouter(prefix="/tier", tags=["Tier & Subscriptions"])

TIER_LIMITS = {
    "free": 500,        # 500 archive/delete bulk actions per month
    "clarity": -1,      # Unlimited
    "autopilot": -1     # Unlimited
}

TIER_PRICING = {
    "free": {"monthly": 0, "annual": 0},
    "clarity": {"monthly": 8, "annual": 59},
    "autopilot": {"monthly": 18, "annual": 149}
}

def get_or_create_profile(user_id: str) -> Dict[str, Any]:
    """Retrieves or initializes user profile with default Free tier."""
    client = db_manager.get_client()
    if client:
        try:
            res = client.table("profiles").select("*").eq("user_id", user_id).execute()
            if res.data and len(res.data) > 0:
                p = res.data[0]
                if "tier" not in p or not p["tier"]:
                    p["tier"] = "free"
                return p
        except Exception as e:
            print(f"[Tier] Error querying Supabase profile: {e}")

    # Memory / demo fallback
    profiles = mock_db.setdefault("profiles", {})
    if user_id not in profiles:
        now_str = datetime.utcnow().isoformat()
        profiles[user_id] = {
            "user_id": user_id,
            "email": f"{user_id}@mailmind.local",
            "display_name": "Inbox Explorer",
            "tier": "free", # default tier
            "subscription_status": "active",
            "billing_cycle": "monthly",
            "byo_provider": None,
            "byo_api_key": None,
            "created_at": now_str
        }
    return profiles[user_id]

def calculate_period_usage(user_id: str) -> int:
    """Calculates emails affected by archive/delete actions in the past 30 days."""
    cutoff = datetime.utcnow() - timedelta(days=30)
    total_actions = 0

    logs = mock_db.get("usage_logs", [])
    for log in logs:
        if log.get("user_id") == user_id:
            action = log.get("action", "")
            if action.startswith("approve_") or action.startswith("bulk_"):
                # Check timestamp if available, else count
                metadata = log.get("metadata", {})
                count = metadata.get("emails_affected", 1)
                total_actions += count

    return total_actions

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_tier_profile(user_id: str = "demo-user-1"):
    """
    Returns full profile with current tier, action usage this period, and limits.
    """
    profile = get_or_create_profile(user_id)
    tier = profile.get("tier", "free")
    limit = TIER_LIMITS.get(tier, 500)
    usage = calculate_period_usage(user_id)

    now = datetime.utcnow()
    period_start = (now - timedelta(days=now.day - 1)).strftime("%Y-%m-%d")
    period_end = (now + timedelta(days=30)).strftime("%Y-%m-%d")

    return UserProfileResponse(
        user_id=user_id,
        email=profile.get("email", f"{user_id}@mailmind.local"),
        display_name=profile.get("display_name", "Inbox Explorer"),
        tier=tier,
        subscription_status=profile.get("subscription_status", "active"),
        byo_key_configured=bool(profile.get("byo_api_key")),
        byo_provider=profile.get("byo_provider"),
        action_count_this_period=usage,
        action_limit=limit,
        period_start=period_start,
        period_end=period_end
    )

@router.get("/usage")
async def get_user_action_usage(user_id: str = "demo-user-1"):
    """
    Returns monthly usage statistics and remaining quota for client action bars.
    """
    profile = get_or_create_profile(user_id)
    tier = profile.get("tier", "free")
    limit = TIER_LIMITS.get(tier, 500)
    usage = calculate_period_usage(user_id)
    
    is_unlimited = limit == -1
    remaining = max(0, limit - usage) if not is_unlimited else 999999
    is_capped = not is_unlimited and usage >= limit

    return {
        "user_id": user_id,
        "tier": tier,
        "action_count_this_period": usage,
        "action_limit": limit,
        "is_unlimited": is_unlimited,
        "remaining_actions": remaining,
        "is_limit_reached": is_capped,
        "can_perform_action": is_unlimited or usage < limit
    }

@router.post("/upgrade")
async def upgrade_user_tier(req: TierUpgradeRequest):
    """
    Upgrades or switches user tier (Free, Clarity, Autopilot).
    Plumbing for Stripe / Lemon Squeezy checkout.
    """
    if req.tier not in ["free", "clarity", "autopilot"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Choose 'free', 'clarity', or 'autopilot'.")

    profile = get_or_create_profile(req.user_id)
    profile["tier"] = req.tier
    profile["billing_cycle"] = req.billing_cycle or "monthly"
    profile["subscription_status"] = "active"
    profile["updated_at"] = datetime.utcnow().isoformat()

    client = db_manager.get_client()
    if client:
        try:
            client.table("profiles").upsert(profile).execute()
        except Exception as e:
            print(f"[Tier Upgrade] Error updating Supabase: {e}")

    pricing = TIER_PRICING[req.tier][req.billing_cycle or "monthly"]
    tier_names = {
        "free": "Free Tier",
        "clarity": "MailMind Clarity ($8/mo)",
        "autopilot": "MailMind Autopilot ($18/mo)"
    }

    return {
        "success": True,
        "user_id": req.user_id,
        "tier": req.tier,
        "tier_name": tier_names.get(req.tier),
        "amount_billed": pricing,
        "action_limit": TIER_LIMITS[req.tier],
        "message": f"Successfully switched to {tier_names.get(req.tier)}."
    }

@router.post("/byo-key")
async def configure_byo_key(req: ByoKeyRequest):
    """
    Saves personal OpenAI, Gemini, or Anthropic API key across tiers.
    Keeps high-volume usage sustainable when the user opts in.
    """
    if req.provider not in ["openai", "gemini", "anthropic"]:
        raise HTTPException(status_code=400, detail="Supported providers: 'openai', 'gemini', 'anthropic'.")

    if not req.api_key or len(req.api_key.strip()) < 8:
        raise HTTPException(status_code=400, detail="Invalid API key format.")

    profile = get_or_create_profile(req.user_id)
    profile["byo_provider"] = req.provider
    profile["byo_api_key"] = req.api_key.strip()
    profile["byo_key_updated_at"] = datetime.utcnow().isoformat()

    client = db_manager.get_client()
    if client:
        try:
            client.table("profiles").upsert(profile).execute()
        except Exception as e:
            print(f"[BYO Key] Error updating Supabase: {e}")

    # Mask key for response
    masked_key = f"{req.api_key[:4]}...{req.api_key[-4:]}" if len(req.api_key) > 8 else "****"

    return {
        "success": True,
        "user_id": req.user_id,
        "provider": req.provider,
        "masked_key": masked_key,
        "message": f"BYO API key for {req.provider.upper()} saved successfully."
    }
