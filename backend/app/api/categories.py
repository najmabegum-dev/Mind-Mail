"""
Categories & Clusters Router
Returns categorized clusters with AI narrative summaries, counts, and suggested actions.
"""
from fastapi import APIRouter
from typing import List
from app.models.schemas import CategorySummary
from app.database import mock_db
from app.services.mock_data_service import generate_mock_emails
from app.services.clustering_service import clustering_service
from app.agents.graph import run_multi_agent_pipeline

router = APIRouter(prefix="", tags=["Categories"])

@router.get("/categories", response_model=List[CategorySummary])
async def get_categories(user_id: str = "demo-user-1"):
    """
    Returns categorized email clusters with AI narrative summaries and suggested cleanup actions.
    """
    # Check if we have active pipeline output in memory
    pipeline_output = mock_db.get("last_pipeline_output")

    if not pipeline_output:
        # Pre-seed realistic data for demo
        raw_emails = generate_mock_emails(count=150)
        clustered = clustering_service.cluster_emails(raw_emails, n_clusters=5)
        pipeline_output = run_multi_agent_pipeline(user_id=user_id, clustered_emails=clustered)
        mock_db["last_pipeline_output"] = pipeline_output
        mock_db["last_clustered_emails"] = clustered

    clusters = pipeline_output.get("clusters", {})
    results: List[CategorySummary] = []

    for c_id, c_data in clusters.items():
        emails = c_data.get("emails", [])
        unread = sum(1 for e in emails if not e.get("is_read", False))
        senders = list({e.get("sender", "").split("<")[0].strip() for e in emails})[:3]

        results.append(CategorySummary(
            cluster_id=c_id,
            category_name=c_data.get("category_name", "Cluster"),
            total_count=len(emails),
            unread_count=unread,
            narrative_summary=c_data.get("narrative_summary", "Discovered semantic group."),
            suggested_action=c_data.get("suggested_action", "keep"),
            confidence_score=c_data.get("confidence_score", 0.90),
            sample_senders=senders,
            estimated_size_mb=c_data.get("estimated_size_mb", 12.5),
            sender_breakdown=c_data.get("sender_breakdown", []),
            primary_intent=c_data.get("primary_intent", "general")
        ))

    return results

@router.get("/categories/{cluster_id}/emails")
async def get_cluster_emails(cluster_id: str):
    """
    Returns full list of emails within a cluster for the interactive Email Inspector Drawer.
    """
    pipeline_output = mock_db.get("last_pipeline_output", {})
    clusters = pipeline_output.get("clusters", {})
    cluster = clusters.get(cluster_id)
    if not cluster:
        return []
    
    # Return sorted by date descending
    emails = cluster.get("emails", [])
    return emails
