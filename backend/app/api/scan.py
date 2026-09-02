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

def execute_scan_task(user_id: str, access_token: str, limit: int = 500):
    global active_scan_state
    try:
        active_scan_state["status"] = "ingesting"
        active_scan_state["message"] = f"Fetching up to {limit} emails concurrently from Gmail API..."
        active_scan_state["progress_percentage"] = 35

        # 1. Ingest Emails
        raw_emails = ingestion_service.ingest_emails(user_id=user_id, access_token=access_token, limit=limit)
        active_scan_state["emails_scanned"] = len(raw_emails)
        active_scan_state["progress_percentage"] = 65

        # 2. Semantic Clustering
        active_scan_state["status"] = "clustering"
        active_scan_state["message"] = f"Clustering {len(raw_emails)} real emails with company & semantic analysis..."
        clustered_emails = clustering_service.cluster_emails(raw_emails, n_clusters=7)
        active_scan_state["progress_percentage"] = 85

        # 3. LangGraph Multi-Agent Pipeline
        active_scan_state["status"] = "analyzing"
        active_scan_state["message"] = "Running LangGraph agents (Classifier, Summarizer, Dedup, Triage)..."
        pipeline_output = run_multi_agent_pipeline(user_id=user_id, clustered_emails=clustered_emails)
        
        # Save results to memory
        mock_db["last_pipeline_output"] = pipeline_output
        mock_db["last_clustered_emails"] = clustered_emails

        active_scan_state["status"] = "completed"
        active_scan_state["progress_percentage"] = 100
        active_scan_state["categories_discovered"] = len(pipeline_output.get("clusters", {}))
        active_scan_state["message"] = f"Success! Discovered {len(pipeline_output.get('clusters', {}))} narrative clusters from your real inbox."

    except Exception as e:
        active_scan_state["status"] = "failed"
        active_scan_state["message"] = f"Scanning failed: {str(e)}"

@router.post("/scan", response_model=ScanStatusResponse)
async def trigger_scan(background_tasks: BackgroundTasks, user_id: str = "demo-user-1", token: str = None, limit: int = 500):
    """
    Trigger full email scan, clustering, and multi-agent pipeline.
    """
    global active_scan_state
    effective_token = token if (token and token != "mock_token") else mock_db.get("latest_gmail_token", "mock_token")

    active_scan_state["status"] = "started"
    active_scan_state["progress_percentage"] = 10
    active_scan_state["message"] = f"Initializing scan for {limit} emails..."

    background_tasks.add_task(execute_scan_task, user_id, effective_token, limit)
    return ScanStatusResponse(**active_scan_state)

@router.get("/scan/status", response_model=ScanStatusResponse)
async def get_scan_status():
    """Check live status of the ongoing scanning and agent analysis."""
    return ScanStatusResponse(**active_scan_state)
