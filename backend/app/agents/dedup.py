"""
Dedup Agent
Identifies duplicate chains, automated drip emails, and repeated alert patterns across senders.
"""
from typing import Dict, Any
from app.agents.state import PipelineState

def dedup_clusters(state: PipelineState) -> PipelineState:
    clusters = state.get("clusters", {})
    logs = state.get("logs", [])

    for cluster_id, cluster in clusters.items():
        emails = cluster.get("emails", [])
        subjects = [e.get("subject", "") for e in emails]

        # Calculate repetitive subjects count
        subject_counts = {}
        for s in subjects:
            # normalize subject
            norm = s.lower().replace("re:", "").replace("fwd:", "").strip()
            subject_counts[norm] = subject_counts.get(norm, 0) + 1

        redundant_count = sum(c - 1 for c in subject_counts.values() if c > 1)
        
        cluster["redundancy_info"] = {
            "duplicate_or_thread_count": redundant_count,
            "unique_threads": len(subject_counts),
            "repetition_ratio": round(redundant_count / max(len(emails), 1), 2)
        }

    logs.append("Dedup Agent: Redundancy and thread repetition analyzed.")
    return {"clusters": clusters, "logs": logs}
