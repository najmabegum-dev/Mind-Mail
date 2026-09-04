import React from 'react';
import { Mail, Sparkles, LogOut, BarChart3, Bot, Send, Zap } from 'lucide-react';

export default function Navbar({ 
  user, 
  currentTier = 'free', 
  onOpenPricing, 
  onOpenChat, 
  onOpenDraft, 
  onOpenStats, 
  onOpenFeedback, 
  onLogout 
}) {
  const tierBadges = {
    free: { label: 'Free Plan (500/mo)', bg: 'bg-amber-100 text-amber-900 border-amber-300' },
    clarity: { label: 'Clarity (Unlimited)', bg: 'bg-seabreeze/20 text-seabreeze-dark border-seabreeze/40' },
    autopilot: { label: 'Autopilot (VIP)', bg: 'bg-amalfitile text-white border-amalfitile' }
  };

  const badge = tierBadges[currentTier] || tierBadges.free;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand (Structured with Amalfi Tile #2E5AA7) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amalfitile flex items-center justify-center shadow-amalfi-struct text-white">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-amalfitile-dark tracking-tight">MailMind</span>
              
              {/* Interactive Tier Badge */}
              <button
                type="button"
                onClick={onOpenPricing}
                title="Click to view plans & upgrade"
                className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full border transition hover:opacity-85 flex items-center gap-1 ${badge.bg}`}
              >
                <span>{badge.label}</span>
                <span className="text-[9px] underline">Upgrade</span>
              </button>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">AI Multi-Agent Gmail Assistant</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Ask Inbox (AI Chatbot) */}
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-seabreeze/15 text-amalfitile-dark border border-[#EEDFB8] shadow-sm transition"
            title="Ask questions about your scanned email threads"
          >
            <Bot className="w-3.5 h-3.5 text-amalfitile" />
            <span className="hidden sm:inline">Ask Inbox</span>
          </button>

          {/* AI Draft Assistant */}
          <button
            onClick={onOpenDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-citrus/15 text-slate-900 border border-[#EEDFB8] shadow-sm transition"
            title="Draft email responses with 1-tap approval"
          >
            <Sparkles className="w-3.5 h-3.5 text-citrus" />
            <span className="hidden sm:inline">Draft Assistant</span>
          </button>

          {/* Pricing Button */}
          <button
            onClick={onOpenPricing}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold bg-citrus hover:bg-citrus-hover text-slate-950 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95"
            title="View Free, Clarity, and Autopilot subscription tiers"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Plans</span>
          </button>

          <div className="h-4 w-px bg-amber-900/15 mx-1 hidden sm:block" />

          {/* Proof Stats */}
          <button
            onClick={onOpenStats}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-[#FBF6E9] text-amalfitile border border-amber-900/10 shadow-sm transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Proof</span>
          </button>

          {user && (
            <div className="flex items-center gap-1.5 sm:gap-2 ml-1">
              <div className="w-8 h-8 rounded-full bg-amalfitile/15 border border-amalfitile/30 flex items-center justify-center text-xs font-bold text-amalfitile">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-amalfitile transition rounded-lg hover:bg-white"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
