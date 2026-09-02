"""
Summarizer Agent
Produces structured, sender-by-sender contextual digests with actionable bullet points.
Synthesizes real subject contexts rather than generic word dumps.
"""
import re
from typing import Dict, Any, List
from collections import Counter, defaultdict
from app.agents.state import PipelineState
from app.config import settings

STOP_WORDS = {
    "a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "is", "are", 
    "your", "you", "from", "with", "new", "re", "fwd", "alert", "update", "notification",
    "this", "week", "today", "digest", "daily", "monthly", "inside", "recommended", "documents",
    "fwd:", "re:", "important", "please", "account"
}

def extract_sender_context(subjects: List[str], org_name: str) -> str:
    """Synthesizes an insightful contextual sentence from a sender's subject lines."""
    if not subjects:
        return f"Periodic updates from {org_name}."

    all_text = " ".join(subjects).lower()

    # Domain specific context synthesis
    if any(w in all_text for w in ["loan", "fastrack", "credit limit", "pre-approved", "emi", "disbursed"]):
        return "Pre-approved personal loan offers, credit line enhancements, and financing options."
    if any(w in all_text for w in ["statement", "e-statement", "account balance", "transaction alert", "debited"]):
        return "Monthly bank e-statements, transaction alerts, and balance notifications."
    if any(w in all_text for w in ["reading", "book", "library", "scribd", "author", "titles for you"]):
        return "Reading recommendations, curated document digests, and library updates."
    if any(w in all_text for w in ["job", "hiring", "role", "developer", "engineer", "opening", "recommended jobs"]):
        # Extract specific job titles if present
        roles = []
        for role in ["AI Engineer", "Python Developer", "Full Stack", "Data Scientist", "Software Engineer", "Frontend", "Backend"]:
            if role.lower() in all_text:
                roles.append(role)
        roles_str = f" for {', '.join(roles[:2])}" if roles else ""
        return f"New job openings, recruiter alerts, and matching opportunities{roles_str}."
    if any(w in all_text for w in ["course", "enroll", "learn", "discount", "python", "masterclass"]):
        return "Course enrollment alerts, skill bootcamps, and technical learning modules."
    if any(w in all_text for w in ["template", "design", "figma", "presentation", "brand"]):
        return "Shared workspace templates, design collaborations, and creative assets."
    if any(w in all_text for w in ["meeting", "agenda", "zoom", "invite"]):
        return "Calendar invites, meeting confirmations, and session agendas."
    if any(w in all_text for w in ["hackathon", "challenge", "sprint", "prize"]):
        return "Coding challenge registrations, hackathon timelines, and prize submissions."

    # Fallback: Extract the 3 most representative keywords from the subjects
    words = []
    for s in subjects:
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', s.lower())
        tokens = [w for w in cleaned.split() if len(w) > 3 and w not in STOP_WORDS]
        words.extend(tokens)
    top_words = [w.title() for w, _ in Counter(words).most_common(3)]
    if top_words:
        return f"Discussions regarding {', '.join(top_words)}."
    
    return f"Announcements and service updates from {org_name}."

def summarize_clusters(state: PipelineState) -> PipelineState:
    clusters = state.get("clusters", {})
    logs = state.get("logs", [])

    for cluster_id, cluster in clusters.items():
        emails = cluster.get("emails", [])
        total_count = len(emails)
        if total_count == 0:
            continue

        unread_count = sum(1 for e in emails if not e.get("is_read", False))

        # 1. Group by distinct sender/organization
        sender_groups = defaultdict(list)
        for e in emails:
            org = e.get("_org") or e.get("domain") or "Sender"
            sender_groups[org].append(e)

        sender_breakdown = []
        for org, org_emails in sorted(sender_groups.items(), key=lambda x: len(x[1]), reverse=True):
            org_unread = sum(1 for e in org_emails if not e.get("is_read", False))
            org_subjects = [e.get("subject", "") for e in org_emails if e.get("subject")]
            
            # Find unsubscribe link if any email has one
            unsub_url = next((e.get("unsubscribe_url") for e in org_emails if e.get("unsubscribe_url")), None)
            
            # Context synthesis
            context = extract_sender_context(org_subjects, org)
            
            # Dead subscription check: >= 5 emails and > 85% unread
            is_dead_sub = len(org_emails) >= 5 and (org_unread / len(org_emails)) >= 0.85

            sender_breakdown.append({
                "sender_name": org,
                "count": len(org_emails),
                "unread_count": org_unread,
                "context": context,
                "sample_subjects": org_subjects[:3],
                "unsubscribe_url": unsub_url,
                "is_dead_subscription": is_dead_sub
            })

        cluster["sender_breakdown"] = sender_breakdown

        # 2. Executive Narrative Summary
        top_senders = [f"{s['sender_name']} ({s['count']})" for s in sender_breakdown[:3]]
        top_str = ", ".join(top_senders)
        unread_pct = round((unread_count / total_count) * 100) if total_count > 0 else 0

        # Create clean, informative overview
        cluster["narrative_summary"] = (
            f"{total_count} emails from {top_str}. "
            f"{unread_count} remain unopened ({unread_pct}% unread). "
            f"Review the sender breakdown below for specific contexts."
        )

        cluster["estimated_size_mb"] = round((total_count * 45) / 1024, 2)

    logs.append(f"Summarizer Agent: Built structured sender breakdowns for {len(clusters)} clusters.")
    return {"clusters": clusters, "logs": logs}
