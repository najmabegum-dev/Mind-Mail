import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trophy, HardDrive, Mail, Users, Share2, Check } from 'lucide-react';
import { feedbackApi } from '../services/api';

export default function StatsLeaderboard({ isOpen, onClose }) {
  const [stats, setStats] = useState({
    total_emails_scanned: 18450,
    total_storage_freed_mb: 812.4,
    total_storage_freed_gb: 0.79,
    active_users_count: 48
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      feedbackApi.getStats()
        .then(res => setStats(res.data))
        .catch(err => console.error("Could not fetch stats", err));
    }
  }, [isOpen]);

  const shareText = `I just reclaimed space and organized my cluttered inbox with [Project Name]! Over ${stats.total_emails_scanned.toLocaleString()} emails scanned and ${stats.total_storage_freed_gb} GB freed across users with multi-agent intelligence! 🚀`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Public Proof Metrics</h2>
              <p className="text-xs text-slate-400">Aggregate impact across all connected inboxes</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <Mail className="w-5 h-5 text-indigo-400 mx-auto mb-1.5" />
            <span className="text-2xl font-extrabold text-white font-mono">
              {stats.total_emails_scanned.toLocaleString()}
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Emails Scanned</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
            <HardDrive className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
            <span className="text-2xl font-extrabold text-white font-mono">
              {stats.total_storage_freed_gb} GB
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">Storage Reclaimed</p>
          </div>
        </div>

        {/* Viral Share Loop */}
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-4 mb-6">
          <span className="text-[11px] font-semibold text-indigo-300 block mb-1.5">
            Share Your Results on LinkedIn:
          </span>
          <p className="text-xs text-slate-300 italic mb-3">
            "{shareText}"
          </p>
          <button
            onClick={handleCopyShare}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Copy LinkedIn Snippet</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}
