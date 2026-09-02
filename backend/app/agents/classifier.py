"""
Classifier Agent
Analyzes organizations, subject keywords, and intent to assign highly descriptive, accurate cluster titles.
"""
from typing import Dict, Any
from collections import Counter
from app.agents.state import PipelineState

def classify_clusters(state: PipelineState) -> PipelineState:
    clusters = state.get("clusters", {})
    logs = state.get("logs", [])

    for cluster_id, cluster in clusters.items():
        emails = cluster.get("emails", [])
        if not emails:
            continue

        # Extract organizations in this cluster
        orgs = [e.get("_org") for e in emails if e.get("_org") and e.get("_org") != "General"]
        org_counter = Counter(orgs)
        top_orgs = [org for org, count in org_counter.most_common(3)]
        
        # Check primary intent
        intents = [e.get("_intent", "general") for e in emails]
        intent_counter = Counter(intents)
        primary_intent = intent_counter.most_common(1)[0][0] if intent_counter else "general"

        # Generate descriptive title
        if cluster_id.startswith("org_"):
            main_org = top_orgs[0] if top_orgs else cluster_id.replace("org_", "").replace("_", " ").title()
            if primary_intent == "jobs":
                cat_name = f"{main_org}: Job Alerts & Recommended Roles"
            elif primary_intent == "networking":
                cat_name = f"{main_org}: Recruiter Outreach & Network Updates"
            elif primary_intent == "learning":
                cat_name = f"{main_org}: Courses & Learning Announcements"
            elif primary_intent == "creative":
                cat_name = f"{main_org}: Design & Workspace Notifications"
            elif primary_intent == "devtools":
                cat_name = f"{main_org}: Repository & Release Alerts"
            elif primary_intent == "banking":
                cat_name = f"{main_org}: Banking & Account Alerts"
            elif primary_intent == "promotions":
                cat_name = f"{main_org}: Deals & Order Notifications"
            else:
                cat_name = f"{main_org}: Updates & Notifications"

        elif primary_intent == "jobs":
            senders_str = ", ".join(top_orgs[:3]) if top_orgs else "Various Companies"
            cat_name = f"Job Openings & Career Alerts ({senders_str})"

        elif primary_intent == "learning":
            senders_str = ", ".join(top_orgs[:3]) if top_orgs else "EdTech Platforms"
            cat_name = f"Courses & Skill Bootcamps ({senders_str})"

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
            cat_name = f"Professional Networking & Inquiries ({senders_str})"

        elif primary_intent == "promotions":
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "Deals & Shopping"
            cat_name = f"Marketing Deals & Discounts ({senders_str})"

        else:
            senders_str = ", ".join(top_orgs[:2]) if top_orgs else "External Senders"
            cat_name = f"General Updates ({senders_str})"

        cluster["category_name"] = cat_name

    logs.append(f"Classifier Agent: Intelligently classified {len(clusters)} clusters.")
    return {"clusters": clusters, "logs": logs}
