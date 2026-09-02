"""
Approval Queue & Action Execution Router
Executes user-approved archive or delete calls against the Gmail API and records audit logs.
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
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
