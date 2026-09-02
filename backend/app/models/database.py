"""
Database entity definitions and helpers.
"""
from typing import Dict, Any

def profile_to_dict(user_id: str, display_name: str, email_verified: bool = False, phone: str = None, phone_verified: bool = False) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "display_name": display_name,
        "email_verified": email_verified,
        "phone": phone,
        "phone_verified": phone_verified
    }

def usage_log_entry(user_id: str, action: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "user_id": user_id,
        "action": action,
        "metadata": metadata
    }
