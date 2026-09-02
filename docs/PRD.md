# [Project Name] — AI Multi-Agent Gmail Sorting & Cleanup Assistant

**Product Requirements Document (PRD)**  
**Prepared by:** Najma | AI Engineer  
**Version:** 0.1 (Draft for prototype build)  

This document captures the product vision, architecture, workflows, feature scope, and post-PRD build/launch plan for **[Project Name]**, discussed and refined in a working session. It is intended to be handed directly into an agentic dev environment (e.g. Antigravity) to begin implementation.

---

## 1. Problem Statement

Gmail inboxes accumulate thousands of unread, uncategorized emails over time (e.g. 10,000+ emails, over half unread). Existing tools either apply shallow rule-based filters (sender/subject matching) or basic AI labels (newsletter, promo, service notice), but none provide a deep, narrative understanding of what an inbox actually contains — e.g. *"62 mails from Unstop about hackathon reminders, 40 unopened"* — and none let a user safely hand over full inbox access with confidence that nothing important will be lost.

---

## 2. Goals

- **Comprehensive Inbox Understanding:** Let a user connect their Gmail and have it fully scanned and understood, not just labeled.
- **Organic Semantic Clustering:** Automatically discover and group emails into meaningful categories (banks, job postings, Unstop, LinkedIn, promos, etc.) without hardcoded rules.
- **Narrative Intelligence:** Generate a human-readable narrative summary per category/sender cluster.
- **Safe Inbox Reclaiming:** Let the user safely archive/delete in bulk with a review step, to reclaim inbox space.
- **Public & Shareable Product:** Build a public, shareable version (open-source + LinkedIn launch) with its own user base, sign-in, and feedback loop.

---

## 3. Target Users

- **Primary:** The builder herself — validating the tool on a real 10k-email inbox.
- **Secondary:** LinkedIn audience / early adopters with similarly cluttered Gmail inboxes who opt in to try the hosted demo.

---

## 4. Core Features (MVP)

| Feature | Description | Why it matters |
| :--- | :--- | :--- |
| **Gmail OAuth (read-only)** | Connect Gmail via OAuth with `gmail.readonly` scope first. | Safe starting point; builds trust before granting write access. |
| **Ingestion** | Paginated pull of email metadata + body into the database. | Foundation for all downstream analysis. |
| **Semantic Clustering** | Embed sender + subject + body, cluster with FAISS (or pgvector). | Discovers categories organically instead of hardcoding a list. |
| **Multi-Agent Pipeline (LangGraph)** | Classifier, Summarizer, Dedup, and Triage agents. | Produces the narrative per-cluster summaries that differentiate this tool. |
| **Approval-Queue Actions** | Suggested archive/delete actions, nothing executes without explicit user approval. | Removes the biggest trust barrier to granting full inbox control. |
| **Dashboard UI** | Folder cards with category, count, AI summary, and action buttons. | The core user-facing experience. |

---

## 5. Phase 2 Features (Post-MVP)

| Feature | Why it matters |
| :--- | :--- |
| **Unsubscribe suggestions** | Attacks root cause of clutter, not just symptoms; strong demo moment. |
| **Weekly digest email** | Brings users back without opening the app; builds a habit loop. |
| **Action-item extraction** | Pulls out deadlines/OTPs/interview dates; the 'AI secretary' tier competitors lack. |
| **Opt-in storage-freed leaderboard** | Gamifies usage; cheap viral loop for LinkedIn shares. |
| **Undo / 30-day recovery bin** | Directly answers the biggest objection to giving 'full control.' |
| **Teachable category rules** | User corrects a misclassification once, system remembers per sender; feels personalized. |

---

## 6. Tech Stack

| Layer | Choice | Notes |
| :--- | :--- | :--- |
| **Backend** | FastAPI (Python) | Serves REST endpoints, orchestrates the agent pipeline. |
| **Agent Orchestration** | LangGraph | Multi-agent graph: `Classifier -> Summarizer -> Dedup -> Triage`. |
| **Embeddings / Clustering** | FAISS (or Supabase pgvector) | Semantic clustering of emails into natural categories. |
| **Database** | Supabase (Postgres) | Hosted Postgres + Auth + instant API; swappable for local Postgres/SQLite. |
| **Auth** | Supabase Auth | Email verification mandatory; phone OTP optional. |
| **Frontend** | React + Framer Motion | Animated dashboard, live scanning animation, animated counters. |
| **Email Source** | Gmail API (OAuth) | `gmail.readonly` first; `gmail.modify` added later for actions. |

---

## 7. System Architecture & Data Flow

### Data Flow

```text
Gmail (OAuth) 
  → Ingestion service 
  → Supabase (raw email store) 
  → Embedding + FAISS clustering 
  → LangGraph multi-agent pipeline (Classifier → Summarizer → Dedup → Triage) 
  → Results written back to Supabase (categories, summaries, suggested actions) 
  → Dashboard reads results 
  → User approves actions 
  → Approved actions sent back to Gmail API (archive/label/delete)
```

### Frontend Workflow
- Sign-up / login screen (email required, phone optional) with animated transitions.
- OAuth consent screen for Gmail connection.
- Live 'scanning' animation while ingestion + pipeline run (emails visually sorting into folders).
- Dashboard: animated folder cards (category, count, AI narrative summary).
- Action review screen: approve/reject suggested archive or delete actions per category.
- Feedback widget: text box + optional star rating, accessible from the dashboard.

### Backend Workflow
- Auth endpoints delegate to Supabase Auth (`signup`, `verify-otp`, `login`).
- Middleware validates JWT on every protected request, extracts `user_id`.
- `/connect-gmail`: handles OAuth handshake, stores refresh token securely.
- `/scan`: triggers ingestion + clustering + agent pipeline as a background job.
- `/categories`: returns categorized results + summaries for the dashboard.
- `/actions/approve`: executes approved archive/delete calls against the Gmail API.
- `/feedback`: POST to store a message, GET to list (paginated) for admin/public view.
- Every meaningful action writes a row to `usage_logs` for per-user and aggregate stats.

### Database Schema

| Table | Key Columns |
| :--- | :--- |
| `auth.users` | Managed by Supabase Auth (do not modify directly). |
| `profiles` | `user_id` (FK), `display_name`, `email_verified`, `phone` (nullable), `phone_verified`, `created_at` |
| `emails` | `id`, `user_id` (FK), `sender`, `domain`, `subject`, `snippet`, `body`, `date`, `category`, `cluster_id` |
| `usage_logs` | `id`, `user_id` (FK), `action`, `metadata` (`jsonb`: `emails_scanned`, `emails_deleted`, `storage_freed_mb`), `created_at` |
| `feedback` | `id`, `user_id` (FK, nullable), `message`, `rating` (nullable), `is_public` (`bool`), `created_at` |

---

## 8. Sign-in & Verification Flow

- **Email verification:** Mandatory, via confirmation link/OTP (Supabase Auth handles this natively).
- **Phone number:** Collected at sign-up but verification is optional, not mandatory — reduces sign-up friction while still allowing a phone-based channel for users who opt in.
- **Session management:** Handled via JWT in an `httpOnly` cookie; protected routes check validity server-side.
- **Profiles table:** The actual 'customer base' record used for signup/active-user counts.

---

## 9. Feedback / Comments

A lightweight comment-style feedback feature: users can leave a message (and optional rating) from the dashboard. Feedback is stored in the `feedback` table; an `is_public` flag allows selected entries to be displayed back on a public page as testimonials once reviewed.

---

## 10. Success Metrics

- **Signups and email-verified active users** (from `profiles` + `usage_logs`).
- **Total emails scanned and storage freed**, aggregated across all users (`usage_logs` metadata) — used as public proof points.
- **Feedback volume and sentiment** from the `feedback` table.
- **Demo shareability:** LinkedIn post engagement driven by real before/after numbers from the builder's own inbox.

---

## 11. What To Do After This PRD (Build & Launch Plan)

This PRD is meant to be handed into an agentic coding environment (e.g. Antigravity) to scaffold and build the prototype. Suggested sequence:

### Phase A — Prototype (read-only, personal use)
1. Set up Supabase project (Auth + Postgres) and a Google Cloud project with Gmail API OAuth credentials, scope `gmail.readonly` only.
2. Feed this PRD into Antigravity / your agentic IDE to scaffold the FastAPI backend, DB schema (from Section 7), and a basic React frontend shell.
3. Build ingestion endpoint, run it against your own inbox, confirm emails land correctly in Supabase.
4. Add embeddings + FAISS clustering; manually sanity-check whether the clusters match real categories (banks, Unstop, LinkedIn, etc.).
5. Build the LangGraph pipeline (Classifier, Summarizer, Dedup, Triage) and verify summaries read naturally.

### Phase B — Actions + Auth (still just you)
1. Add the approval-queue UI and wire it to the Gmail API with `gmail.modify` scope for archive/label actions.
2. Add the 30-day recovery-bin behavior before allowing permanent delete.
3. Add Supabase Auth (email mandatory, phone optional) and the `profiles` + `usage_logs` tables.
4. Add the animated scanning sequence and animated counters (Framer Motion) once the pipeline output is stable.

### Phase C — Public Demo + Launch
1. Add the feedback widget and, if desired, the opt-in storage-freed leaderboard.
2. Run the full flow on your own 10k-email inbox end-to-end; capture real before/after numbers and a screen recording of the scanning animation.
3. Push the repo to GitHub (clean README, architecture diagram, setup instructions) to open-source it.
4. Write the LinkedIn launch post anchored on your own real results (e.g. *"X emails sorted, Y MB freed"*), link to the repo/demo, and invite people to try it on their own inbox.
5. After launch, monitor `usage_logs` and feedback to prioritize which Phase-2 feature (unsubscribe suggestions, digest email, action-item extraction, teachable rules) to build next based on what users actually ask for.

---

*End of document. This PRD reflects decisions made through a planning conversation and is intended as a living document — update it as scope shifts during the build.*
