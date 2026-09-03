"""
Classifier Agent
Analyzes organizations, subject keywords, and intent to assign highly descriptive cluster titles,
map clusters into parent categories for hierarchical rollup, and flag sensitive clusters.
"""
from typing import Dict, Any
from collections import Counter
from app.agents.state import PipelineState

PARENT_CATEGORY_MAP = {
    "jobs": ("jobs", "Job Alerts & Careers"),
    "banking": ("banking", "Banking & Finance"),
    "devtools": ("devtools", "Developer & AI Tools"),
    "learning": ("learning", "Courses & Learning"),
    "creative": ("creative", "Design & Productivity"),
    "reading": ("reading", "Reading & Subscriptions"),
    "networking": ("networking", "Social & Networking"),
    "promotions": ("promotions", "Promotions & Orders"),
    "hackathon": ("learning", "Courses & Learning"),
    "general": ("general", "General & Miscellaneous"),
}

def classify_clusters(state: PipelineState) -> PipelineState:
    clusters = state.get("clusters", {})
    logs = state.get("logs", [])

    for cluster_id, cluster in clusters.items():
        emails = cluster.get("emails", [])
        if not emails:
            continue

        # Extract organizations in this cluster
        orgs = [e.get("_org") for e in emails if e.get("_org") and e.get("_org") != "Independent Sender"]
        org_counter = Counter(orgs)
        top_orgs = [org for org, count in org_counter.most_common(3)]
        
        # Check primary intent
        intents = [e.get("_intent", "general") for e in emails]
        intent_counter = Counter(intents)
        primary_intent = intent_counter.most_common(1)[0][0] if intent_counter else "general"

        # Map to Parent Category
        parent_id, parent_name = PARENT_CATEGORY_MAP.get(primary_intent, ("general", "General & Miscellaneous"))
        cluster["parent_id"] = parent_id
        cluster["parent_category"] = parent_name
        cluster["primary_intent"] = primary_intent

        # Generate descriptive title
        if cluster_id.startswith("org_"):
            main_org = top_orgs[0] if top_orgs else cluster_id.replace("org_", "").replace("_", " ").title()
            if primary_intent == "jobs":
                cat_name = f"{main_org}: Job Alerts & Roles"
            elif primary_intent == "networking":
                cat_name = f"{main_org}: Network & Inquiries"
            elif primary_intent == "learning":
                cat_name = f"{main_org}: Courses & Skill Training"
            elif primary_intent == "creative":
                cat_name = f"{main_org}: Design & Workspace Notifications"
            elif primary_intent == "devtools":
                cat_name = f"{main_org}: Repository & Release Alerts"
            elif primary_intent == "banking":
                cat_name = f"{main_org}: Banking & Account Alerts"
            elif primary_intent == "promotions":
                cat_name = f"{main_org}: Deals & Order Notifications"
            elif primary_intent == "reading":
                cat_name = f"{main_org}: Reading Lists & Library Digests"
            else:
                cat_name = f"{main_org}: Updates & Notifications"

        elif primary_intent == "jobs":
            senders_str = ", ".join(top_orgs[:3]) if top_orgs else "Various Companies"
            cat_name = f"Job Openings & Recruiter Matches ({senders_str})"

        elif primary_intent == "learning":
            senders_str = ", ".join(top_orgs[:3]) if top_orgs else "EdTech Platforms"
            cat_name = f"Courses & Technical Learning ({senders_str})"

        elif primary_intent == "creative":
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Design Tools"
            cat_name = f"Creative & Design Tools ({senders_str})"

        elif primary_intent == "banking":
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Financial Institutions"
            cat_name = f"Banking & Transaction Alerts ({senders_str})"

        elif primary_intent == "hackathon":
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Hackathon Organizers"
            cat_name = f"Hackathons & Coding Competitions ({senders_str})"

        elif primary_intent == "networking":
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Professional Networks"
            cat_name = f"Professional Inquiries & Networking ({senders_str})"

        elif primary_intent == "reading":
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Publishers"
            cat_name = f"Reading Digests & Publications ({senders_str})"

        elif primary_intent == "promotions":
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Shopping & Delivery"
            cat_name = f"Promotions & Discount Offers ({senders_str})"

        else:
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Miscellaneous Senders"
            cat_name = f"General Updates ({senders_str})"

        cluster["category_name"] = cat_name

        # Sensitivity & Needs-Review Flagging (Fix #4)
        all_text = " ".join([e.get("subject", "") for e in emails] + [e.get("sender", "") for e in emails]).lower()
        is_sensitive = False
        reason = None

        if primary_intent == "banking" or any(w in all_text for w in ["bank", "hdfc", "kotak", "icici", "sbi", "loan", "debit", "credit card", "statement", "kyc"]):
            is_sensitive = True
            reason = "Financial & Banking notifications require careful review."
        elif any(w in all_text for w in ["interview invitation", "offer letter", "hr team", "shortlisted for", "scheduled call"]):
            is_sensitive = True
            reason = "Direct recruiter and interview notices require manual review."
        elif any(w in all_text for w in ["income tax", "gov.in", "aadhaar", "passport", "epfo"]):
            is_sensitive = True
            reason = "Government and legal notifications must never be swept in bulk."

        cluster["is_sensitive"] = is_sensitive
        cluster["needs_review"] = is_sensitive
        cluster["sensitivity_reason"] = reason

    logs.append(f"Classifier Agent: Classified {len(clusters)} clusters with hierarchical parent mapping.")
    return {"clusters": clusters, "logs": logs}
