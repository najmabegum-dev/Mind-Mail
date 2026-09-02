"""
Intelligent Email Clustering Service
Groups emails by sending company/organization and semantic intent (e.g. Job Alerts,
Online Courses, Creative Tools, Financial Statements, etc.).
"""
import re
from typing import List, Dict, Any
from collections import defaultdict, Counter

KNOWN_BRANDS = {
    "glassdoor": "Glassdoor",
    "indeed": "Indeed",
    "linkedin": "LinkedIn",
    "foundit": "Foundit",
    "soothsayer": "Soothsayer Analytics",
    "codingninjas": "Coding Ninjas",
    "canva": "Canva",
    "udemy": "Udemy",
    "coursera": "Coursera",
    "unstop": "Unstop",
    "github": "GitHub",
    "zomato": "Zomato",
    "swiggy": "Swiggy",
    "hdfc": "HDFC Bank",
    "icici": "ICICI Bank",
    "sbi": "State Bank of India",
    "ford": "Ford Careers",
    "google": "Google",
    "amazon": "Amazon",
    "flipkart": "Flipkart",
    "hackerrank": "HackerRank",
    "leetcode": "LeetCode"
}

def extract_organization(sender: str, domain: str) -> str:
    """Extract a clean, recognizable organization or company name."""
    sender_lower = sender.lower()
    domain_lower = domain.lower() if domain else ""

    # Check known brands
    for key, name in KNOWN_BRANDS.items():
        if key in sender_lower or key in domain_lower:
            return name

    # Try display name before '<'
    if "<" in sender:
        display = sender.split("<")[0].strip(" \"'")
        # If display name is not an email address and has substance
        if display and "@" not in display and len(display) > 2:
            clean = re.sub(r'[\(\[].*?[\)\]]', '', display).strip()
            clean = re.sub(r'(Team|Support|Updates|Alerts|Notifications|Careers|News|Digest|Bot)$', '', clean, flags=re.IGNORECASE).strip()
            if clean:
                return clean

    # Fallback to domain name root
    if domain:
        parts = domain_lower.split(".")
        if len(parts) >= 2:
            root = parts[-2] if parts[-1] in ["com", "in", "org", "net", "io", "co"] and len(parts) >= 2 else parts[0]
            if len(root) > 2:
                return root.title()

    return "General"

def detect_email_intent(subject: str, snippet: str, org: str) -> str:
    """Classify the primary intent of an email."""
    text = f"{subject} {snippet} {org}".lower()

    if any(w in text for w in ["job", "hiring", "recruiter", "interview", "career", "opening", "vacancy", "application", "resume", "role"]):
        return "jobs"
    if any(w in text for w in ["course", "tutorial", "learn", "academy", "class", "coding", "bootcamp", "webinar", "b-school", "admission"]):
        return "learning"
    if any(w in text for w in ["canva", "design", "template", "figma", "graphic", "presentation"]):
        return "creative"
    if any(w in text for w in ["debit", "credited", "upi", "statement", "kyc", "neft", "imps", "account alert", "bank balance", "otp for login"]):
        return "banking"
    if any(w in text for w in ["hackathon", "contest", "competition", "challenge", "devsprint"]):
        return "hackathon"
    if any(w in text for w in ["linkedin", "invitation to connect", "searches this week", "viewed your profile"]):
        return "networking"
    if any(w in text for w in ["discount", "coupon", "off on your", "craving", "order confirmed", "delivered", "sale"]):
        return "promotions"
    if any(w in text for w in ["github", "pull request", "release", "commit", "ci/cd", "workflow run"]):
        return "devtools"

    return "general"

class ClusteringService:
    def cluster_emails(self, emails: List[Dict[str, Any]], n_clusters: int = 5) -> List[Dict[str, Any]]:
        """
        Intelligently groups emails by company and topic.
        Assigns cluster_id to each email.
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
        # If an organization has >= 10 emails, give it a dedicated company cluster
        # Otherwise, group by intent + dominant organizations
        for e in emails:
            org = e["_org"]
            intent = e["_intent"]

            if org_counts[org] >= 10 and org != "General":
                # Dedicated company cluster
                c_key = f"org_{org.lower().replace(' ', '_')}"
            else:
                # Thematic cluster by intent
                c_key = f"intent_{intent}"

            e["cluster_id"] = c_key

        return emails

clustering_service = ClusteringService()
