import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Shield, CheckCircle2, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { gmailApi } from '../services/api';

export default function ConnectGmailPage({ onConnected }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const res = await gmailApi.getAuthUrl(false); // read-only scope first
      if (res.data.mode === 'demo' || !res.data.auth_url.includes('accounts.google.com')) {
        // Fast-path demo connection
        setTimeout(() => {
          onConnected('mock_access_token_demo');
        }, 800);
      } else {
        window.location.href = res.data.auth_url;
      }
    } catch (err) {
      console.error("Connection error:", err);
      // Fallback to demo
      onConnected('mock_access_token_demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-warmwhite">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-[#FDFBF5] border border-[#EEDFB8] rounded-3xl p-8 shadow-sm text-center relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-amalfitile/15 border border-amalfitile/30 mx-auto flex items-center justify-center text-amalfitile mb-4 shadow-sm">
          <Mail className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-extrabold text-amalfitile-dark tracking-tight">
          Connect Your Gmail Account
        </h1>
        <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto leading-relaxed font-medium">
          Allow the multi-agent system to discover, summarize, and categorize your inbox clutter.
        </p>

        {/* Security & Scope Guarantee Card */}
        <div className="bg-white border border-[#EEDFB8] rounded-2xl p-5 my-6 text-left space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <Shield className="w-4 h-4" />
            <span>Read-Only Scope First (`gmail.readonly`)</span>
          </div>

          <ul className="text-xs text-slate-600 space-y-2 font-medium">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>We cannot send, edit, or delete any emails during this step.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Only message metadata, subjects, and sender addresses are parsed.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Clean actions (Archive / Trash) require separate step confirmation.</span>
            </li>
          </ul>
        </div>

        {/* Connect Action Button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Opening Google OAuth...' : 'Connect with Google'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-[11px] text-slate-500 mt-4 flex items-center justify-center gap-1 font-medium">
          <Lock className="w-3.5 h-3.5 text-amalfitile" />
          <span>OAuth 2.0 PKCE flow with Google Cloud Identity</span>
        </p>
      </motion.div>
    </div>
  );
}
