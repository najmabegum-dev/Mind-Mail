"""
Summarizer Agent
Produces specific, clear, content-grounded narrative summaries
based on real subjects, sender organizations, and unopened email patterns.
"""
import re
from typing import Dict, Any, List
from collections import Counter
from app.agents.state import PipelineState

STOP_WORDS = {
    "a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "is", "are", 
    "your", "you", "from", "with", "new", "re", "fwd", "alert", "update", "notification",
    "this", "week", "today", "digest", "daily", "monthly"
}

def extract_key_topics(subjects: List[str], top_n: int = 3) -> List[str]:
    """Extracts prominent keywords or phrases from email subjects."""
    words = []
    for s in subjects:
        # Clean subject
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', s.lower())
        tokens = [w for w in cleaned.split() if len(w) > 3 and w not in STOP_WORDS]
        words.extend(tokens)

    counter = Counter(words)
    return [w.title() for w, _ in counter.most_common(top_n)]

def summarize_clusters(state: PipelineState) -> PipelineState:
    clusters = state.get("clusters", {})
    logs = state.get("logs", [])

    for cluster_id, cluster in clusters.items():
        emails = cluster.get("emails", [])
        total_count = len(emails)
        if total_count == 0:
            continue

        unread_count = sum(1 for e in emails if not e.get("is_read", False))
        category = cluster.get("category_name", "Cluster")

        # 1. Analyze sender organizations
        orgs = [e.get("_org") for e in emails if e.get("_org") and e.get("_org") != "General"]
        if not orgs:
            orgs = [e.get("domain", "Unknown") for e in emails]
        org_counts = Counter(orgs)
        top_org_breakdown = [f"{org} ({count})" for org, count in org_counts.most_common(3)]
        top_org_str = ", ".join(top_org_breakdown) if top_org_breakdown else "various senders"

        # 2. Extract key topics from actual subjects
        subjects = [e.get("subject", "") for e in emails if e.get("subject")]
        key_topics = extract_key_topics(subjects, top_n=3)
        topics_str = f"Common topics include: {', '.join(key_topics)}." if key_topics else ""

        # 3. Construct clear narrative summary
        unread_pct = round((unread_count / total_count) * 100) if total_count > 0 else 0

        narrative = (
            f"{total_count} emails primarily sent from {top_org_str}. "
            f"{unread_count} emails ({unread_pct}%) remain unopened. "
            f"{topics_str}"
        )

        cluster["narrative_summary"] = narrative
        # Approximate size: average 45 KB per email
        cluster["estimated_size_mb"] = round((total_count * 45) / 1024, 2)

    logs.append("Summarizer Agent: Generated content-grounded narrative summaries.")
    return {"clusters": clusters, "logs": logs}
