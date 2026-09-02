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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center relative"
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <Mail className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-white tracking-tight">
          Connect Your Gmail Account
        </h1>
        <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          Allow the multi-agent system to discover, summarize, and categorize your inbox clutter.
        </p>

        {/* Security & Scope Guarantee Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 my-6 text-left space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <Shield className="w-4 h-4" />
            <span>Read-Only Scope First (`gmail.readonly`)</span>
          </div>

          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>We cannot send, edit, or delete any emails during this step.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Embeddings are calculated locally or within your private cluster.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Nothing is ever archived or deleted without your explicit review.</span>
            </li>
          </ul>
        </div>

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/25 disabled:opacity-50 transition transform active:scale-95"
        >
          {loading ? (
            <span>Connecting to Gmail...</span>
          ) : (
            <>
              <span>Connect Gmail (Read-Only)</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 mt-4">
          Demo Mode active: Clicking will launch the 10,000 email synthetic inbox simulation.
        </p>
      </motion.div>
    </div>
  );
}
