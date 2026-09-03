"""
Scan & Pipeline Execution Router
Triggers email ingestion, FAISS clustering, and the LangGraph multi-agent pipeline.
"""
from fastapi import APIRouter, BackgroundTasks, Query
from app.models.schemas import ScanStatusResponse
from app.services.ingestion_service import ingestion_service
from app.services.clustering_service import clustering_service
from app.agents.graph import run_multi_agent_pipeline
from app.database import mock_db

router = APIRouter(prefix="", tags=["Scan"])

# Global scanning state tracker
active_scan_state = {
    "status": "idle",
    "progress_percentage": 0,
    "emails_scanned": 0,
    "categories_discovered": 0,
    "message": "System ready. Ready to scan inbox."
}

from app.services.gmail_service import gmail_service

def execute_scan_task(
    user_id: str, 
    access_token: str, 
    limit: int = 500, 
    from_date: str = None, 
    to_date: str = None
):
    global active_scan_state
    try:
        date_str = f" ({from_date or 'Earliest'} to {to_date or 'Latest'})" if (from_date or to_date) else ""
        active_scan_state["status"] = "ingesting"
        active_scan_state["message"] = f"Fetching emails{date_str} concurrently from Gmail API..."
        active_scan_state["progress_percentage"] = 35

        # 1. Ingest Emails
        raw_emails = ingestion_service.ingest_emails(
            user_id=user_id, 
            access_token=access_token, 
            limit=limit,
            from_date=from_date,
            to_date=to_date
        )
        active_scan_state["emails_scanned"] = len(raw_emails)
        active_scan_state["progress_percentage"] = 65

        # 2. Semantic Clustering
        active_scan_state["status"] = "clustering"
        active_scan_state["message"] = f"Clustering {len(raw_emails)} emails with brand & semantic intent analysis..."
        clustered_emails = clustering_service.cluster_emails(raw_emails, n_clusters=8)
        active_scan_state["progress_percentage"] = 85

        # 3. LangGraph Multi-Agent Pipeline
        active_scan_state["status"] = "analyzing"
        active_scan_state["message"] = "Generating structured sender breakdowns and contextual summaries..."
        pipeline_output = run_multi_agent_pipeline(user_id=user_id, clustered_emails=clustered_emails)
        
        # Save results to memory
        mock_db["last_pipeline_output"] = pipeline_output
        mock_db["last_clustered_emails"] = clustered_emails

        # Compute range-specific metrics
        unread_in_range = sum(1 for e in raw_emails if not e.get("is_read", False))
        read_in_range = len(raw_emails) - unread_in_range
        unsub_in_range = sum(1 for e in raw_emails if e.get("unsubscribe_url"))
        storage_in_range = round((len(raw_emails) * 45) / 1024, 2)

        mock_db["last_range_metrics"] = {
            "from_date": from_date or "Earliest",
            "to_date": to_date or "Present",
            "total_emails": len(raw_emails),
            "unread_emails": unread_in_range,
            "read_emails": read_in_range,
            "storage_mb": storage_in_range,
            "clusters_count": len(pipeline_output.get("clusters", {})),
            "unsubscribe_count": unsub_in_range
        }

        active_scan_state["status"] = "completed"
        active_scan_state["progress_percentage"] = 100
        active_scan_state["categories_discovered"] = len(pipeline_output.get("clusters", {}))
        active_scan_state["message"] = f"Success! Discovered {len(pipeline_output.get('clusters', {}))} structured clusters."

    except Exception as e:
        active_scan_state["status"] = "failed"
        active_scan_state["message"] = f"Scanning failed: {str(e)}"

@router.get("/scan/range-metrics")
async def get_range_metrics():
    """Returns analytics for the most recently scanned date range."""
    return mock_db.get("last_range_metrics", {})

@router.get("/profile/stats")
async def get_profile_telemetry(user_id: str = "demo-user-1", token: str = None):
    """
    Returns exact real-time Gmail inbox telemetry:
    Total messages, unread, opened, and estimated storage.
    """
    effective_token = token if (token and token != "mock_token") else mock_db.get("latest_gmail_token", "mock_token")
    return gmail_service.get_inbox_metrics(effective_token)

@router.post("/scan", response_model=ScanStatusResponse)
async def trigger_scan(
    background_tasks: BackgroundTasks, 
    user_id: str = "demo-user-1", 
    token: str = None, 
    limit: int = 3000,
    from_date: str = None,
    to_date: str = None
):
    """
    Trigger full email scan with date range filtering, clustering, and multi-agent pipeline.
    """
    global active_scan_state
    effective_token = token if (token and token != "mock_token") else mock_db.get("latest_gmail_token", "mock_token")

    active_scan_state["status"] = "started"
    active_scan_state["progress_percentage"] = 10
    range_lbl = f"({from_date} to {to_date})" if (from_date or to_date) else f"up to {limit} emails"
    active_scan_state["message"] = f"Initializing scan for {range_lbl}..."

    background_tasks.add_task(execute_scan_task, user_id, effective_token, limit, from_date, to_date)
    return ScanStatusResponse(**active_scan_state)

@router.get("/scan/status", response_model=ScanStatusResponse)
async def get_scan_status():
    """Check live status of the ongoing scanning and agent analysis."""
    return ScanStatusResponse(**active_scan_state)
