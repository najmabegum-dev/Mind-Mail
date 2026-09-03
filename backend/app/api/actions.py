"""
Approval Queue & Action Execution Router
Executes user-approved archive or delete calls against the Gmail API and records audit logs.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from app.models.schemas import ActionApprovalRequest, ActionApprovalResponse
from app.services.gmail_service import gmail_service
from app.database import mock_db, db_manager

router = APIRouter(prefix="/actions", tags=["Actions"])

@router.post("/approve", response_model=ActionApprovalResponse)
async def approve_action(req: ActionApprovalRequest, user_id: str = "demo-user-1", token: str = "mock_token"):
    """
    Executes user-approved action (archive, 30-day trash/delete, or keep)
    across the cluster or selected email IDs.
    """
    pipeline_output = mock_db.get("last_pipeline_output", {})
    clusters = pipeline_output.get("clusters", {})
    cluster = clusters.get(req.cluster_id)

    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found.")

    target_emails = cluster.get("emails", [])
    if req.custom_email_ids:
        target_emails = [e for e in target_emails if e.get("id") in req.custom_email_ids]

    email_ids = [e.get("id") for e in target_emails]
    count = len(email_ids)
    storage_freed = round((count * 45) / 1024, 2) if req.action in ["archive", "delete"] else 0.0

    # Execute against Gmail API
    gmail_service.execute_batch_action(access_token=token, message_ids=email_ids, action=req.action)

    # Record row in usage_logs table
    log_entry = {
        "user_id": user_id,
        "action": f"approve_{req.action}",
        "metadata": {
            "cluster_id": req.cluster_id,
            "category_name": cluster.get("category_name"),
            "emails_affected": count,
            "storage_freed_mb": storage_freed
        }
    }
    mock_db["usage_logs"].append(log_entry)

    client = db_manager.get_client()
    if client:
        try:
            client.table("usage_logs").insert(log_entry).execute()
        except Exception as e:
            print(f"[Audit Log] Error writing to Supabase usage_logs: {e}")

    # Update memory cluster state
    if req.action == "delete":
        cluster["emails"] = []
    elif req.action == "archive":
        for e in target_emails:
            e["is_archived"] = True

    action_verbs = {
        "archive": "safely archived to inbox archive",
        "delete": "moved to Gmail Trash (protected by 30-day recovery bin)",
        "keep": "kept in primary inbox"
    }

    return ActionApprovalResponse(
        success=True,
        cluster_id=req.cluster_id,
        action=req.action,
        emails_affected=count,
        storage_freed_mb=storage_freed,
        message=f"{count} emails {action_verbs.get(req.action, 'processed')}. Freed ~{storage_freed} MB."
    )

from pydantic import BaseModel
class BulkActionRequest(BaseModel):
    cluster_ids: List[str]
    action: str

class UnsubscribeRequest(BaseModel):
    unsubscribe_url: str
    one_click_post: bool = False

@router.post("/bulk-approve")
async def bulk_approve_actions(req: BulkActionRequest, user_id: str = "demo-user-1", token: str = "mock_token"):
    """
    Executes user-approved bulk action across multiple clusters concurrently.
    """
    pipeline_output = mock_db.get("last_pipeline_output", {})
    clusters = pipeline_output.get("clusters", {})

    total_emails = 0
    all_email_ids = []

    for c_id in req.cluster_ids:
        cluster = clusters.get(c_id)
        if not cluster:
            continue
        emails = cluster.get("emails", [])
        e_ids = [e.get("id") for e in emails]
        all_email_ids.extend(e_ids)
        total_emails += len(e_ids)

        if req.action == "delete":
            cluster["emails"] = []
        elif req.action == "archive":
            for e in emails:
                e["is_archived"] = True

    storage_freed = round((total_emails * 45) / 1024, 2) if req.action in ["archive", "delete"] else 0.0

    # Execute against Gmail
    if all_email_ids:
        gmail_service.execute_batch_action(access_token=token, message_ids=all_email_ids, action=req.action)

    # Log to usage_logs
    log_entry = {
        "user_id": user_id,
        "action": f"bulk_{req.action}",
        "metadata": {
            "cluster_count": len(req.cluster_ids),
            "emails_affected": total_emails,
            "storage_freed_mb": storage_freed
        }
    }
    mock_db["usage_logs"].append(log_entry)

    client = db_manager.get_client()
    if client:
        try:
            client.table("usage_logs").insert(log_entry).execute()
        except Exception as e:
            print(f"[Audit Log] Error writing to Supabase: {e}")

    return {
        "success": True,
        "clusters_affected": len(req.cluster_ids),
        "emails_affected": total_emails,
        "storage_freed_mb": storage_freed,
        "message": f"Bulk {req.action} applied to {total_emails} emails across {len(req.cluster_ids)} clusters. Freed ~{storage_freed} MB."
    }

@router.post("/unsubscribe")
async def handle_unsubscribe(req: UnsubscribeRequest):
    """
    RFC 8058 compliant one-click unsubscribe handler or verified landing page redirection.
    """
    url = req.unsubscribe_url
    if not url:
        raise HTTPException(status_code=400, detail="Missing unsubscribe destination.")

    import httpx

    # 1. RFC 8058 One-Click POST
    if req.one_click_post and url.startswith("http"):
        try:
            headers = {
                "User-Agent": "MailMind-Agent/0.1 (RFC 8058 Compliance)",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            # RFC 8058 dictates POST body 'List-Unsubscribe=One-Click'
            resp = httpx.post(url, data="List-Unsubscribe=One-Click", headers=headers, timeout=10.0)
            if resp.status_code in [200, 202, 204]:
                return {
                    "success": True,
                    "method": "one_click_rfc8058",
                    "status_code": resp.status_code,
                    "message": "Successfully unsubscribed via RFC 8058 One-Click POST."
                }
        except Exception as e:
            print(f"[Unsubscribe] RFC 8058 POST failed, falling back: {e}")

    # 2. Fallback to direct web URL
    return {
        "success": True,
        "method": "web_url",
        "url": url,
        "message": "Open web unsubscribe destination."
    }
