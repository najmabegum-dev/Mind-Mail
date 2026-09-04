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

from collections import defaultdict
from app.models.schemas import CategorySummary, ParentCategoryRollup

@router.get("/categories", response_model=List[CategorySummary])
async def get_categories(user_id: str = "demo-user-1"):
    """
    Returns categorized email clusters with AI narrative summaries and suggested cleanup actions.
    """
    pipeline_output = mock_db.get("last_pipeline_output")

    if not pipeline_output or not pipeline_output.get("clusters"):
        raw_emails = generate_mock_emails(count=150)
        clustered = clustering_service.cluster_emails(raw_emails, n_clusters=5)
        pipeline_output = run_multi_agent_pipeline(user_id=user_id, clustered_emails=clustered)
        mock_db["last_pipeline_output"] = pipeline_output
        mock_db["last_clustered_emails"] = clustered
        if not mock_db.get("last_range_metrics") or mock_db.get("last_range_metrics", {}).get("total_emails", 0) == 0:
            mock_db["last_range_metrics"] = {
                "from_date": "Last 30 Days",
                "to_date": "Present",
                "total_emails": 2840,
                "unread_emails": 412,
                "read_emails": 2428,
                "storage_mb": 127.8,
                "clusters_count": len(pipeline_output.get("clusters", {})),
                "unsubscribe_count": 38
            }

    clusters = pipeline_output.get("clusters", {})
    results: List[CategorySummary] = []

    for c_id, c_data in clusters.items():
        emails = c_data.get("emails", [])
        unread = sum(1 for e in emails if not e.get("is_read", False))
        senders = list({e.get("sender", "").split("<")[0].strip() for e in emails})[:3]

        results.append(CategorySummary(
            cluster_id=c_id,
            category_name=c_data.get("category_name", "Cluster"),
            parent_id=c_data.get("parent_id", "general"),
            parent_category=c_data.get("parent_category", "General & Miscellaneous"),
            total_count=len(emails),
            unread_count=unread,
            narrative_summary=c_data.get("narrative_summary", "Discovered semantic group."),
            suggested_action=c_data.get("suggested_action", "keep"),
            confidence_score=c_data.get("confidence_score", 0.90),
            sample_senders=senders,
            estimated_size_mb=c_data.get("estimated_size_mb", 12.5),
            sender_breakdown=c_data.get("sender_breakdown", []),
            primary_intent=c_data.get("primary_intent", "general"),
            is_sensitive=c_data.get("is_sensitive", False),
            needs_review=c_data.get("needs_review", False),
            sensitivity_reason=c_data.get("sensitivity_reason")
        ))

    return results

@router.get("/categories/rollup", response_model=List[ParentCategoryRollup])
async def get_categories_rollup(user_id: str = "demo-user-1"):
    """
    Returns hierarchical rollup of clusters grouped into ~6-10 parent categories.
    """
    flat_categories = await get_categories(user_id=user_id)
    grouped = defaultdict(list)

    for cat in flat_categories:
        grouped[cat.parent_id].append(cat)

    rollups: List[ParentCategoryRollup] = []
    for p_id, cluster_list in grouped.items():
        p_name = cluster_list[0].parent_category if cluster_list else "General"
        tot_emails = sum(c.total_count for c in cluster_list)
        unr_emails = sum(c.unread_count for c in cluster_list)
        storage = round(sum(c.estimated_size_mb for c in cluster_list), 2)
        has_sensitive = any(c.is_sensitive for c in cluster_list)

        rollups.append(ParentCategoryRollup(
            parent_id=p_id,
            parent_name=p_name,
            total_emails=tot_emails,
            unread_emails=unr_emails,
            storage_mb=storage,
            clusters_count=len(cluster_list),
            clusters=cluster_list,
            is_sensitive=has_sensitive,
            needs_review=has_sensitive
        ))

    # Sort parent categories by total emails descending
    rollups.sort(key=lambda x: x.total_emails, reverse=True)
    return rollups

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
