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
    total_count: int
    unread_count: int
    narrative_summary: str
    suggested_action: str # "archive", "delete", "keep", "label"
    confidence_score: float
    sample_senders: List[str]
    estimated_size_mb: float
    sender_breakdown: List[Dict[str, Any]] = []
    primary_intent: str = "general"

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
