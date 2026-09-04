"""
Pydantic Schemas for Requests and Responses
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# Auth Schemas
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: Optional[str] = "Inbox Explorer"
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    token: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Email & Category Schemas
class EmailItem(BaseModel):
    id: str
    user_id: str
    sender: str
    domain: str
    subject: str
    snippet: str
    body: Optional[str] = ""
    date: Optional[str] = None
    category: Optional[str] = None
    cluster_id: Optional[str] = None
    is_read: bool = False
    is_archived: bool = False
    is_deleted: bool = False

class CategorySummary(BaseModel):
    cluster_id: str
    category_name: str
    parent_id: str = "general"
    parent_category: str = "General & Miscellaneous"
    total_count: int
    unread_count: int
    narrative_summary: str
    suggested_action: str # "archive", "delete", "keep", "label"
    confidence_score: float
    sample_senders: List[str]
    estimated_size_mb: float
    sender_breakdown: List[Dict[str, Any]] = []
    primary_intent: str = "general"
    is_sensitive: bool = False
    needs_review: bool = False
    sensitivity_reason: Optional[str] = None

class ParentCategoryRollup(BaseModel):
    parent_id: str
    parent_name: str
    total_emails: int
    unread_emails: int
    storage_mb: float
    clusters_count: int
    clusters: List[CategorySummary] = []
    is_sensitive: bool = False
    needs_review: bool = False

class BulkActionApprovalRequest(BaseModel):
    cluster_ids: List[str]
    action: str # "archive", "delete", "keep"

class ScanStatusResponse(BaseModel):
    status: str # "idle", "ingesting", "clustering", "analyzing", "completed", "failed"
    progress_percentage: int
    emails_scanned: int
    categories_discovered: int
    message: str

class ActionApprovalRequest(BaseModel):
    cluster_id: str
    action: str # "archive", "delete", "keep"
    target_all_in_cluster: bool = True
    custom_email_ids: Optional[List[str]] = None

class ActionApprovalResponse(BaseModel):
    success: bool
    cluster_id: str
    action: str
    emails_affected: int
    storage_freed_mb: float
    message: str

# Feedback Schemas
class FeedbackCreate(BaseModel):
    message: str
    rating: Optional[int] = Field(None, ge=1, le=5)

class FeedbackResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    message: str
    rating: Optional[int] = None
    is_public: bool = True
    created_at: str

# Tier & Billing Schemas
class TierUpgradeRequest(BaseModel):
    user_id: str
    tier: str # "free", "clarity", "autopilot"
    billing_cycle: Optional[str] = "monthly" # "monthly" or "annual"

class ByoKeyRequest(BaseModel):
    user_id: str
    provider: str # "openai", "gemini", "anthropic"
    api_key: str

class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    display_name: str
    tier: str = "free" # "free", "clarity", "autopilot"
    subscription_status: str = "active"
    byo_key_configured: bool = False
    byo_provider: Optional[str] = None
    action_count_this_period: int = 0
    action_limit: int = 500 # 500 for free, -1 for unlimited
    period_start: str
    period_end: str

# AI Clarity Chatbot Schemas
class ChatCitation(BaseModel):
    email_id: str
    sender: str
    subject: str
    date: Optional[str] = None
    snippet: str

class ChatQueryRequest(BaseModel):
    user_id: str
    query: str

class ChatQueryResponse(BaseModel):
    query: str
    answer: str
    citations: List[ChatCitation] = []
    tier_used: str

# AI Autopilot Email Draft Schemas
class DraftEmailRequest(BaseModel):
    user_id: str
    instruction: str # e.g. "Politely decline recruiter interview for next week"
    reply_to_email_id: Optional[str] = None
    recipient_email: Optional[str] = None
    tone: Optional[str] = "professional" # "professional", "concise", "friendly"

class DraftEmailResponse(BaseModel):
    draft_id: str
    recipient: str
    subject: str
    body: str
    status: str = "pending_review" # "pending_review", "approved", "sent"
    reasoning: str
    mandatory_review_notice: str = "Review before sending — MailMind never sends without your explicit 1-tap confirmation."

class ApproveDraftRequest(BaseModel):
    user_id: str
    draft_id: str
    approved: bool
    final_subject: str
    final_body: str
    send_now: bool = False # If true, creates draft and sends; if false, saves as draft in Gmail

# Scheduled Rescan Schemas (Autopilot Tier)
class ScheduleRescanRequest(BaseModel):
    user_id: str
    enabled: bool = True
    frequency: str = "weekly" # "weekly", "biweekly", "monthly"
    preferred_day: str = "Sunday" # "Monday" .. "Sunday"
    preferred_hour_utc: int = 6 # 0-23
    send_email_digest: bool = True

class ScheduleRescanResponse(BaseModel):
    user_id: str
    enabled: bool
    frequency: str
    preferred_day: str
    preferred_hour_utc: int
    send_email_digest: bool
    next_run: str
    last_run: Optional[str] = None
    status: str = "active"

# Smart Unsubscribe Assistant Schemas
class UnsubscribeSuggestion(BaseModel):
    id: str
    sender_name: str
    sender_email: str
    domain: str
    cluster_name: str
    email_count: int
    estimated_size_mb: float
    unsubscribe_url: Optional[str] = None
    one_click_mailto: Optional[str] = None
    suggested_action: str = "unsubscribe_and_archive" # "unsubscribe_and_archive", "keep", "delete"

class UnsubscribeSuggestionsResponse(BaseModel):
    total_subscriptions: int
    estimated_monthly_noise_count: int
    suggestions: List[UnsubscribeSuggestion] = []

# Action-Item & Deadline Extraction Schemas
class ActionItem(BaseModel):
    id: str
    email_id: str
    subject: str
    sender: str
    sender_email: str
    date: str
    action_type: str # "invoice_due", "interview_reply", "meeting_request", "action_required", "follow_up"
    action_description: str
    deadline: Optional[str] = None
    urgency: str = "medium" # "high", "medium", "low"
    needs_draft: bool = True

class ActionItemsResponse(BaseModel):
    total_action_items: int
    urgent_count: int
    action_items: List[ActionItem] = []


