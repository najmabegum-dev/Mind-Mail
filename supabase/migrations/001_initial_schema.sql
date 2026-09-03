-- Initial Schema for MailMind (AI Multi-Agent Gmail Assistant)
-- Enables UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone TEXT,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Emails Table (Raw & Processed Mail Store)
CREATE TABLE IF NOT EXISTS public.emails (
    id TEXT PRIMARY KEY, -- Gmail message id
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    domain TEXT,
    subject TEXT,
    snippet TEXT,
    body TEXT,
    date TIMESTAMP WITH TIME ZONE,
    category TEXT,
    cluster_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_emails_user_id ON public.emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_cluster_id ON public.emails(cluster_id);
CREATE INDEX IF NOT EXISTS idx_emails_category ON public.emails(category);
CREATE INDEX IF NOT EXISTS idx_emails_date ON public.emails(date DESC);

-- 3. Usage Logs Table (Audit & Metrics Tracking)
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- e.g. 'scan', 'archive', 'delete'
    metadata JSONB DEFAULT '{}'::jsonb, -- { emails_scanned: 10240, emails_deleted: 3500, storage_freed_mb: 420.5 }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- 4. Feedback Table (User Feedback & Testimonials)
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_is_public ON public.feedback(is_public);

-- 5. Row-Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select and update their own profile
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = user_id);

-- Emails: Users have full access only to their own emails
CREATE POLICY "Users can view own emails" 
    ON public.emails FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emails" 
    ON public.emails FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own emails" 
    ON public.emails FOR UPDATE 
    USING (auth.uid() = user_id);

-- Usage Logs: Users can view their own activity logs
CREATE POLICY "Users can view own logs" 
    ON public.usage_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" 
    ON public.usage_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Feedback: Anyone can read approved public testimonials; authenticated users can insert
CREATE POLICY "Anyone can read public feedback" 
    ON public.feedback FOR SELECT 
    USING (is_public = TRUE);

CREATE POLICY "Users can insert feedback" 
    ON public.feedback FOR INSERT 
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
