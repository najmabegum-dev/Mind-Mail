"""
Mock Data Service
Generates synthetic, realistic cluttered email datasets (e.g. 10,000 email inbox simulation)
representing real categories mentioned in the PRD (Unstop hackathons, Banks, LinkedIn, Newsletters, etc.).
"""
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta

MOCK_TEMPLATES = [
    {
        "category": "Hackathons & Contests",
        "sender": "Unstop Opportunities <updates@unstop.com>",
        "domain": "unstop.com",
        "subject_pool": [
            "Reminder: 48 Hours left for National AI Hackathon 2026!",
            "Exclusive Hackathon Invite: Build with Generative Agents",
            "Deadline Alert: Submit your pitch deck for Antigravity Global Challenge",
            "Over 10,000 developers registered. Join the DevSprint Hackathon",
            "Your registration for Global AI Hackathon is confirmed",
            "Last Call: Round 1 ends tonight at 11:59 PM!"
        ],
        "snippet": "Don't miss your chance to compete against the best engineering minds in the country. Grand prize $25,000...",
        "ratio": 0.25, # 25% of inbox
        "unread_prob": 0.65
    },
    {
        "category": "Banking & Transactions",
        "sender": "HDFC Bank Alerts <alerts@hdfcbank.net>",
        "domain": "hdfcbank.net",
        "subject_pool": [
            "Account Alert: INR 450.00 debited via UPI to Swiggy",
            "Your Monthly E-Statement for Account ending in 8912",
            "Security Notice: One-Time Password for NetBanking Login",
            "Transaction Alert: INR 2,199.00 debited via AutoPay",
            "Important: Update your KYC details online before month end"
        ],
        "snippet": "Dear Customer, INR 450.00 has been debited from your A/C **8912 on 02-SEP-26. Call 1800 if not done by you...",
        "ratio": 0.15,
        "unread_prob": 0.40
    },
    {
        "category": "Professional & LinkedIn",
        "sender": "LinkedIn Notifications <updates@linkedin.com>",
        "domain": "linkedin.com",
        "subject_pool": [
            "You appeared in 14 searches this week",
            "Najma, people are looking at your profile",
            "New Job Recommendation: AI Engineer at DeepMind",
            "Alex and 4 others shared new updates today",
            "Connect with recruiters hiring for Senior Python Developer roles"
        ],
        "snippet": "See who searched for you and discover open opportunities matching your skills in AI, Python, and LangGraph...",
        "ratio": 0.20,
        "unread_prob": 0.70
    },
    {
        "category": "Developer Newsletters & Tools",
        "sender": "GitHub Notifications <notifications@github.com>",
        "domain": "github.com",
        "subject_pool": [
            "[GitHub] A new release v0.4.0 is available for langchain-ai/langgraph",
            "[Security Advisory] Dependabot detected 1 moderate vulnerability in repository",
            "[GitHub Actions] Workflow run 'CI/CD Test Suite' succeeded",
            "Daily Digest: 5 new pull requests opened in organization",
            "Your GitHub Copilot billing invoice for August 2026"
        ],
        "snippet": "Repository updates, releases, and discussions summary. View online on GitHub...",
        "ratio": 0.20,
        "unread_prob": 0.50
    },
    {
        "category": "Promotions & E-Commerce",
        "sender": "Zomato Deals <promotions@zomato.com>",
        "domain": "zomato.com",
        "subject_pool": [
            "Craving Biryani? 50% OFF up to INR 100 on your next order",
            "Midnight Cravings sorted! Top restaurants near you",
            "Your Gold membership renewal is coming up",
            "Weekend treat! Free delivery on orders over INR 299",
            "Flash Sale: 40% off on premium desserts today only!"
        ],
        "snippet": "Satisfy your cravings with special discounts handpicked for you. Open the app to claim...",
        "ratio": 0.20,
        "unread_prob": 0.85
    }
]

def generate_mock_emails(count: int = 150) -> List[Dict[str, Any]]:
    """Generate realistic synthetic emails for demo simulation."""
    emails = []
    base_time = datetime.utcnow()

    for i in range(count):
        cat_info = random.choices(
            MOCK_TEMPLATES, 
            weights=[t["ratio"] for t in MOCK_TEMPLATES], 
            k=1
        )[0]

        subject = random.choice(cat_info["subject_pool"])
        delta_days = random.randint(0, 180)
        delta_minutes = random.randint(0, 1440)
        date_sent = base_time - timedelta(days=delta_days, minutes=delta_minutes)
        is_unread = random.random() < cat_info["unread_prob"]

        emails.append({
            "id": f"msg_mock_{i+1:05d}",
            "user_id": "demo-user-1",
            "sender": cat_info["sender"],
            "domain": cat_info["domain"],
            "subject": subject,
            "snippet": cat_info["snippet"],
            "body": f"{cat_info['snippet']} Full email body content with detailed message text #{i+1}.",
            "date": date_sent.isoformat() + "Z",
            "category": cat_info["category"],
            "cluster_id": f"cluster_{cat_info['category'].lower().replace(' ', '_').replace('&', 'and')}",
            "is_read": not is_unread,
            "is_archived": False,
            "is_deleted": False
        })

    return emails
