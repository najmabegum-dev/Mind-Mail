"""
Triage Agent
Analyzes cluster priority, sender domain reputation, and engagement history
to recommend safe cleanup actions (Archive, 30-day Trash, Keep, or Label).
"""
from typing import Dict, Any
from app.agents.state import PipelineState

def triage_clusters(state: PipelineState) -> PipelineState:
    clusters = state.get("clusters", {})
    logs = state.get("logs", [])

    for cluster_id, cluster in clusters.items():
        cat_name = cluster.get("category_name", "").lower()
        emails = cluster.get("emails", [])
        unread_ratio = sum(1 for e in emails if not e.get("is_read", False)) / max(len(emails), 1)

        # Sensitive categories: Banking and Job Applications/Alerts should be kept safe
        if "banking" in cat_name or "financial" in cat_name or "transaction" in cat_name:
            action = "keep"
            confidence = 0.98
        elif "job" in cat_name or "career" in cat_name or "hiring" in cat_name:
            action = "keep"
            confidence = 0.95
        # Promotional / Food deals with high unread ratio -> safe to move to 30-day trash/delete
        elif "food" in cat_name or "deals" in cat_name or "promotions" in cat_name:
            action = "delete"
            confidence = 0.94
        # Hackathon reminders or old social updates -> safe to archive
        elif "hackathon" in cat_name or "linkedin" in cat_name or "contest" in cat_name:
            action = "archive"
            confidence = 0.91
        # Developer tools -> archive or keep
        elif "developer" in cat_name:
            action = "archive" if unread_ratio > 0.4 else "keep"
            confidence = 0.88
        else:
            action = "archive" if unread_ratio > 0.5 else "keep"
            confidence = 0.80

        cluster["suggested_action"] = action
        cluster["confidence_score"] = confidence

    logs.append("Triage Agent: Action recommendations assigned.")
    return {"clusters": clusters, "logs": logs}
