"""
Agent Pipeline State Definition for LangGraph
"""
from typing import TypedDict, List, Dict, Any

class ClusterData(TypedDict):
    cluster_id: str
    emails: List[Dict[str, Any]]
    category_name: str
    narrative_summary: str
    redundancy_info: Dict[str, Any]
    suggested_action: str
    confidence_score: float
    estimated_size_mb: float

class PipelineState(TypedDict):
    user_id: str
    raw_emails: List[Dict[str, Any]]
    clusters: Dict[str, ClusterData]
    logs: List[str]
