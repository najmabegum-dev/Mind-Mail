import React from 'react';
import { Mail, Sparkles, LogOut, BarChart3 } from 'lucide-react';

export default function Navbar({ user, onOpenStats, onOpenFeedback, onLogout }) {
  return (
    <header className="sticky top-0 z-40 border-b border-amber-900/10 bg-[#FFFBF3]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand (Structured with Amalfi Tile #2E5AA7) */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amalfitile flex items-center justify-center shadow-amalfi-struct text-white">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-amalfitile-dark tracking-tight">MailMind</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-seabreeze/20 text-seabreeze-dark border border-seabreeze/40">
                Agentic v0.1
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block font-medium">AI Multi-Agent Gmail Assistant</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FBF6E9] text-amalfitile border border-amber-900/10 shadow-sm transition"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Proof Metrics</span>
          </button>

          <button
            onClick={onOpenFeedback}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FBF6E9] text-slate-700 border border-amber-900/10 shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-citrus" />
            <span>Feedback</span>
          </button>

          <div className="h-4 w-px bg-amber-900/15 mx-1" />

          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amalfitile/15 border border-amalfitile/30 flex items-center justify-center text-xs font-bold text-amalfitile">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-coralflame transition rounded-lg hover:bg-white"
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
