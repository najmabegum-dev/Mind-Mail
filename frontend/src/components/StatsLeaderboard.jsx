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

  const shareText = `I just reclaimed space and organized my cluttered inbox with MailMind! Over ${stats.total_emails_scanned.toLocaleString()} emails scanned and ${stats.total_storage_freed_gb} GB freed across users with multi-agent intelligence! 🚀`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#FDFBF5] border-2 border-[#EEDFB8] rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
      >
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amalfitile/15 text-amalfitile border border-amalfitile/25">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-amalfitile-dark">Public Proof Metrics</h2>
              <p className="text-xs text-slate-600 font-medium">Aggregate impact across all connected inboxes</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-amalfitile">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Numbers Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-[#EEDFB8] text-center shadow-sm">
            <Mail className="w-5 h-5 text-amalfitile mx-auto mb-1.5" />
            <span className="text-xl font-extrabold font-mono text-amalfitile-dark block">
              {stats.total_emails_scanned.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Emails Scanned</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#EEDFB8] text-center shadow-sm">
            <HardDrive className="w-5 h-5 text-citrus mx-auto mb-1.5" />
            <span className="text-xl font-extrabold font-mono text-citrus-dark block">
              {stats.total_storage_freed_gb} GB
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Storage Freed</span>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-[#EEDFB8] flex items-center justify-between text-xs text-slate-700 mb-6 shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <Users className="w-4 h-4 text-amalfitile" />
            <span>Active Cleanups:</span>
          </div>
          <span className="font-extrabold font-mono text-slate-900">{stats.active_users_count} Inboxes</span>
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopyShare}
          className="w-full py-3 rounded-xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-800" /> : <Share2 className="w-4 h-4" />}
          <span>{copied ? 'Share Text Copied to Clipboard!' : 'Share Proof on LinkedIn / X'}</span>
        </button>
      </motion.div>
    </div>
  );
}
