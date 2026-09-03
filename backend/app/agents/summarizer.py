"""
Summarizer Agent
Produces distinct, content-derived narrative summaries per sender and per cluster.
Analyzes actual subjects, body snippets, roles, companies, deadlines, and actions
so that no two senders or clusters produce generic boilerplate text.
"""
import re
from typing import Dict, Any, List, Optional
from collections import Counter, defaultdict
from app.agents.state import PipelineState
from app.config import settings

STOP_WORDS = {
    "a", "an", "the", "in", "on", "at", "for", "to", "of", "and", "or", "is", "are", 
    "your", "you", "from", "with", "new", "re", "fwd", "alert", "update", "notification",
    "this", "week", "today", "digest", "daily", "monthly", "inside", "recommended", "documents",
    "fwd:", "re:", "important", "please", "account", "mail", "email", "here", "just"
}

ROLES_PATTERNS = [
    "AI Engineer", "Machine Learning", "Python Developer", "Full Stack", "Data Scientist", 
    "Software Engineer", "Frontend", "Backend", "Data Analyst", "DevOps", "Cloud Architect",
    "Product Manager", "QA Engineer", "Intern", "Graduate Trainee", "Consultant", "Specialist"
]

COMPANIES_PATTERNS = [
    "Google", "Amazon", "Microsoft", "Infosys", "TCS", "Wipro", "Cognizant", "Accenture",
    "Deloitte", "Capgemini", "IBM", "Meta", "Apple", "Oracle", "Cisco", "Intel", "Ford"
]

LOCATIONS_PATTERNS = [
    "Hyderabad", "Bengaluru", "Bangalore", "Pune", "Mumbai", "Delhi", "Noida", "Gurugram", 
    "Chennai", "Remote", "Hybrid", "USA", "India"
]

def extract_content_entities(subjects: List[str], snippets: List[str]) -> Dict[str, Any]:
    """Extracts concrete entities, roles, actions, companies, and locations from email content."""
    combined_text = " ".join(subjects + snippets)
    combined_lower = combined_text.lower()

    # 1. Extract Roles
    detected_roles = []
    for role in ROLES_PATTERNS:
        if role.lower() in combined_lower:
            detected_roles.append(role)

    # 2. Extract Companies
    detected_companies = []
    for company in COMPANIES_PATTERNS:
        if re.search(r'\b' + re.escape(company.lower()) + r'\b', combined_lower):
            detected_companies.append(company)

    # 3. Extract Locations
    detected_locations = []
    for loc in LOCATIONS_PATTERNS:
        if re.search(r'\b' + re.escape(loc.lower()) + r'\b', combined_lower):
            detected_locations.append(loc)

    # 4. Extract Actions/Intents
    actions = []
    if any(w in combined_lower for w in ["viewed your application", "application viewed", "resume viewed", "shortlisted"]):
        actions.append("application view notifications")
    elif any(w in combined_lower for w in ["interview", "invitation to interview", "round 1", "round 2"]):
        actions.append("interview invitations")
    elif any(w in combined_lower for w in ["hiring", "urgent opening", "immediate joiner"]):
        actions.append("urgent hiring announcements")
    elif any(w in combined_lower for w in ["recommended jobs", "jobs matching your search", "matching your profile"]):
        actions.append("job match recommendations")
    
    # Financial actions
    if any(w in combined_lower for w in ["fastrack", "loan", "pre-approved", "disbursal"]):
        actions.append("pre-approved loan offers")
    if any(w in combined_lower for w in ["e-statement", "account statement", "monthly statement"]):
        actions.append("monthly e-statements")
    if any(w in combined_lower for w in ["debited", "credited", "upi transaction", "txn"]):
        actions.append("transaction debit/credit notices")

    # Hackathon / Challenge actions
    if any(w in combined_lower for w in ["hackathon", "devsprint", "challenge", "contest"]):
        actions.append("hackathon registrations")
    if any(w in combined_lower for w in ["deadline extended", "closing soon", "final reminder", "last day to apply"]):
        actions.append("deadline extension reminders")

    # Learning / Course actions
    if any(w in combined_lower for w in ["course enrollment", "enrolled", "bootcamp", "certification"]):
        actions.append("course enrollment updates")
    if any(w in combined_lower for w in ["masterclass", "live webinar", "webinar"]):
        actions.append("webinar invites")

    # Reading / Publishing actions
    if any(w in combined_lower for w in ["curated document", "reading list", "top titles", "library"]):
        actions.append("curated reading recommendations")

    # Workspace / Design actions
    if any(w in combined_lower for w in ["shared design", "template", "workspace", "presentation"]):
        actions.append("shared workspace and template assets")

    # 5. Extract recurring subject tokens (salient nouns)
    words = []
    for s in subjects:
        cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', s.lower())
        tokens = [w for w in cleaned.split() if len(w) > 3 and w not in STOP_WORDS]
        words.extend(tokens)
    top_tokens = [w.title() for w, _ in Counter(words).most_common(3)]

    return {
        "roles": detected_roles[:2],
        "companies": detected_companies[:2],
        "locations": detected_locations[:2],
        "actions": actions[:2],
        "top_tokens": top_tokens
    }

def synthesize_sender_summary(org_name: str, count: int, unread_count: int, subjects: List[str], snippets: List[str]) -> str:
    """
    Constructs a truly distinct, content-derived narrative sentence for a sender
    incorporating specific entities, actions, roles, and open status.
    """
    if count == 0:
        return f"No messages from {org_name}."

    entities = extract_content_entities(subjects, snippets)
    roles = entities["roles"]
    companies = entities["companies"]
    locations = entities["locations"]
    actions = entities["actions"]
    top_tokens = entities["top_tokens"]

    unread_phrase = f"{unread_count} unopened" if unread_count > 0 else "all opened"

    # Build descriptive focus phrase
    focus_parts = []
    if actions:
        focus_parts.append(actions[0])
    
    if roles:
        role_str = " & ".join(roles)
        if locations:
            focus_parts.append(f"openings for {role_str} in {locations[0]}")
        else:
            focus_parts.append(f"openings for {role_str}")
    elif companies:
        focus_parts.append(f"opportunities at {' & '.join(companies)}")
    elif top_tokens and not actions:
        focus_parts.append(f"updates on {', '.join(top_tokens)}")

    if not focus_parts:
        if top_tokens:
            focus_parts.append(f"announcements regarding {top_tokens[0]}")
        else:
            focus_parts.append("periodic notifications and status updates")

    content_focus = ", ".join(focus_parts)

    # Construct the final distinct sentence
    summary_sentence = (
        f"{count} emails from {org_name} regarding {content_focus} ({unread_phrase})."
    )

    return summary_sentence

def try_llm_cluster_summary(cluster_name: str, sender_summaries: List[str], sample_subjects: List[str]) -> Optional[str]:
    """Optional LLM enhancement if user provides an API key."""
    if not (settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY or settings.GEMINI_API_KEY):
        return None

    try:
        if settings.OPENAI_API_KEY:
            import httpx
            prompt = (
                f"Write a crisp 2-sentence executive summary for an email cluster titled '{cluster_name}'.\n"
                f"Sender digests: {'; '.join(sender_summaries[:4])}\n"
                f"Sample subjects: {'; '.join(sample_subjects[:5])}\n"
                f"Be factual, concise, and highlight volume, unopened count, and key topics without fluff."
            )
            headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}", "Content-Type": "application/json"}
            payload = {
                "model": settings.LLM_MODEL or "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 120,
                "temperature": 0.3
            }
            resp = httpx.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload, timeout=8.0)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"[LLM Summarizer] Skipped LLM call: {e}")

    return None

def summarize_clusters(state: PipelineState) -> PipelineState:
    clusters = state.get("clusters", {})
    logs = state.get("logs", [])

    for cluster_id, cluster in clusters.items():
        emails = cluster.get("emails", [])
        total_count = len(emails)
        if total_count == 0:
            continue

        unread_count = sum(1 for e in emails if not e.get("is_read", False))
        cluster_name = cluster.get("category_name", "Cluster")

        # 1. Group by distinct sender/organization
        sender_groups = defaultdict(list)
        for e in emails:
            org = e.get("_org") or e.get("domain") or "Sender"
            sender_groups[org].append(e)

        sender_breakdown = []
        all_cluster_subjects = []

        for org, org_emails in sorted(sender_groups.items(), key=lambda x: len(x[1]), reverse=True):
            org_unread = sum(1 for e in org_emails if not e.get("is_read", False))
            org_subjects = [e.get("subject", "") for e in org_emails if e.get("subject")]
            org_snippets = [e.get("snippet", "") for e in org_emails if e.get("snippet")]
            all_cluster_subjects.extend(org_subjects)
            
            # Find unsubscribe link if any email has one
            unsub_url = next((e.get("unsubscribe_url") for e in org_emails if e.get("unsubscribe_url")), None)
            
            # Distinct Content-Derived Narrative Summary per Sender
            distinct_context = synthesize_sender_summary(
                org_name=org,
                count=len(org_emails),
                unread_count=org_unread,
                subjects=org_subjects,
                snippets=org_snippets
            )
            
            # Dead subscription check: >= 5 emails and > 85% unread
            is_dead_sub = len(org_emails) >= 5 and (org_unread / len(org_emails)) >= 0.85

            sender_breakdown.append({
                "sender_name": org,
                "count": len(org_emails),
                "unread_count": org_unread,
                "context": distinct_context,
                "sample_subjects": org_subjects[:4],
                "unsubscribe_url": unsub_url,
                "is_dead_subscription": is_dead_sub
            })

        cluster["sender_breakdown"] = sender_breakdown

        # 2. Executive Narrative Summary for the Cluster
        top_senders_summaries = [s["context"] for s in sender_breakdown[:3]]
        llm_summary = try_llm_cluster_summary(cluster_name, top_senders_summaries, all_cluster_subjects)

        if llm_summary:
            cluster["narrative_summary"] = llm_summary
        else:
            top_orgs = [f"{s['sender_name']} ({s['count']})" for s in sender_breakdown[:3]]
            unread_pct = round((unread_count / total_count) * 100) if total_count > 0 else 0
            
            # Formulate synthesized cluster summary
            cluster_entities = extract_content_entities(all_cluster_subjects, [])
            focus = cluster_entities["actions"][0] if cluster_entities["actions"] else "direct notifications"
            if cluster_entities["roles"]:
                focus += f" ({', '.join(cluster_entities['roles'])})"
            
            cluster["narrative_summary"] = (
                f"{total_count} emails from {', '.join(top_orgs)} covering {focus}. "
                f"{unread_count} unopened ({unread_pct}% unread). "
                f"Review the sender breakdown for itemized breakdowns."
            )

        cluster["estimated_size_mb"] = round((total_count * 45) / 1024, 2)

    logs.append(f"Summarizer Agent: Built distinct content-derived summaries for {len(clusters)} clusters.")
    return {"clusters": clusters, "logs": logs}
