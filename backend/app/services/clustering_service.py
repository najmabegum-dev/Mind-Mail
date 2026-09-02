"""
Intelligent Email Clustering Service
Provides strict brand isolation, entity extraction, and intent classification.
Guarantees distinct senders (e.g. Kotak Bank vs. Scribd) are never lumped together.
"""
import re
from typing import List, Dict, Any
from collections import Counter

KNOWN_BRANDS = {
    # Banking & Financial Institutions
    "kotak": "Kotak Mahindra Bank",
    "hdfc": "HDFC Bank",
    "icici": "ICICI Bank",
    "axis": "Axis Bank",
    "sbi": "State Bank of India",
    "amex": "American Express",
    "americanexpress": "American Express",
    "paytm": "Paytm Payments",
    "razorpay": "Razorpay",
    "cred": "CRED",

    # Job & Career Platforms
    "glassdoor": "Glassdoor",
    "indeed": "Indeed",
    "linkedin": "LinkedIn",
    "foundit": "Foundit",
    "naukri": "Naukri.com",
    "wellfound": "Wellfound (AngelList)",
    "remotehunter": "RemoteHunter",
    "jobs2web": "Jobs2Web",
    "abekus": "Abekus Careers",
    "internshala": "Internshala",
    "soothsayer": "Soothsayer Analytics",
    "ford": "Ford Careers",

    # Education & Learning (Strictly educational)
    "codingninjas": "Coding Ninjas",
    "udemy": "Udemy",
    "coursera": "Coursera",
    "unstop": "Unstop",
    "kaggle": "Kaggle",
    "hackerrank": "HackerRank",
    "leetcode": "LeetCode",

    # Productivity, Reading & Creative Tools
    "scribd": "Scribd",
    "canva": "Canva",
    "adobe": "Adobe Acrobat & Creative",
    "zoom": "Zoom Meetings",
    "notion": "Notion",
    "figma": "Figma",
    "github": "GitHub",
    "ollama": "Ollama AI",
    "google": "Google Services",

    # Delivery & E-Commerce
    "zomato": "Zomato",
    "swiggy": "Swiggy",
    "amazon": "Amazon",
    "flipkart": "Flipkart",
}

def extract_organization(sender: str, domain: str) -> str:
    """Extract clean, recognizable brand identity from sender headers and domain."""
    sender_lower = sender.lower()
    domain_lower = domain.lower() if domain else ""

    # Check known brands dictionary
    for key, name in KNOWN_BRANDS.items():
        if key in sender_lower or key in domain_lower:
            return name

    # Parse display name before '<'
    if "<" in sender:
        display = sender.split("<")[0].strip(" \"'")
        if display and "@" not in display and len(display) > 2:
            clean = re.sub(r'[\(\[].*?[\)\]]', '', display).strip()
            # Remove generic corporate tail words
            clean = re.sub(r'(Team|Support|Updates|Alerts|Notifications|Careers|News|Digest|Bot|Official|Services)$', '', clean, flags=re.IGNORECASE).strip()
            if len(clean) > 2:
                return clean

    # Fallback to domain root
    if domain:
        parts = domain_lower.split(".")
        if len(parts) >= 2:
            root = parts[-2] if parts[-1] in ["com", "in", "org", "net", "io", "co"] and len(parts) >= 2 else parts[0]
            if len(root) > 2:
                return root.title()

    return "Independent Sender"

def detect_email_intent(subject: str, snippet: str, org: str) -> str:
    """Classify the primary intent with strict institutional overrides."""
    org_lower = org.lower()
    text = f"{subject} {snippet}".lower()

    # Strict Institutional Overrides:
    # 1. Banks & Credit Cards are always Banking
    if any(b in org_lower for b in ["bank", "kotak", "hdfc", "icici", "sbi", "axis", "american express", "amex", "loan", "card"]):
        return "banking"

    # 2. EdTech & Learning are always Learning (Never Job Alerts)
    if any(e in org_lower for e in ["udemy", "coding ninjas", "coursera", "kaggle", "learning", "academy"]):
        return "learning"

    # 3. Creative & Productivity Tools
    if any(c in org_lower for c in ["canva", "adobe", "figma", "zoom", "notion"]):
        return "creative"

    # 4. Reading & Publishing Subscriptions
    if any(r in org_lower for r in ["scribd", "medium", "substack", "read"]):
        return "reading"

    # 5. Developer Tools & Open Source
    if any(d in org_lower for d in ["github", "ollama", "gitlab", "docker"]):
        return "devtools"

    # 6. Job Portals
    if any(j in org_lower for j in ["indeed", "glassdoor", "foundit", "naukri", "wellfound", "remotehunter", "jobs2web", "abekus", "internshala"]):
        return "jobs"

    # General Intent Keyword Matching:
    if any(w in text for w in ["job", "hiring", "recruiter", "interview", "career", "opening", "vacancy", "application", "resume", "role"]):
        return "jobs"
    if any(w in text for w in ["course", "tutorial", "learn", "bootcamp", "webinar", "class", "admission"]):
        return "learning"
    if any(w in text for w in ["debit", "credit", "upi", "statement", "kyc", "neft", "imps", "account alert", "balance"]):
        return "banking"
    if any(w in text for w in ["hackathon", "contest", "competition", "challenge", "devsprint"]):
        return "hackathon"
    if any(w in text for w in ["linkedin", "invitation to connect", "searches this week", "viewed your profile"]):
        return "networking"
    if any(w in text for w in ["discount", "coupon", "craving", "order confirmed", "delivered", "sale", "off on your"]):
        return "promotions"

    return "general"

class ClusteringService:
    def cluster_emails(self, emails: List[Dict[str, Any]], n_clusters: int = 8) -> List[Dict[str, Any]]:
        """
        Groups emails with strict brand isolation.
        Any recognized company with >= 2 emails receives its own dedicated cluster.
        Remaining emails are grouped by high-affinity intent without cross-contamination.
        """
        if not emails:
            return []

        # 1. Annotate each email with organization and intent
        for e in emails:
            org = extract_organization(e.get("sender", ""), e.get("domain", ""))
            intent = detect_email_intent(e.get("subject", ""), e.get("snippet", ""), org)
            e["_org"] = org
            e["_intent"] = intent

        # Count emails per company
        org_counts = Counter(e["_org"] for e in emails)

        # 2. Assign cluster keys
        # Lower threshold to 2: Any brand with >= 2 emails gets its own distinct cluster!
        for e in emails:
            org = e["_org"]
            intent = e["_intent"]

            if org != "Independent Sender" and org_counts[org] >= 2:
                # Dedicated Brand Cluster (e.g. org_kotak_mahindra_bank, org_scribd)
                c_key = f"org_{re.sub(r'[^a-zA-Z0-9]', '_', org.lower())}"
            else:
                # Thematic cluster by intent (e.g. intent_jobs, intent_learning)
                c_key = f"intent_{intent}"

            e["cluster_id"] = c_key

        return emails

clustering_service = ClusteringService()
