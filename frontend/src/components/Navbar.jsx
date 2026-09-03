import React from 'react';
import { Mail, ShieldCheck, Sparkles, LogOut, BarChart3, Sun, Moon } from 'lucide-react';

export default function Navbar({ user, theme = 'cream', onToggleTheme, onOpenStats, onOpenFeedback, onLogout }) {
  const isCream = theme === 'cream';

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
      isCream 
        ? 'border-amber-900/10 bg-[#FAF6EE]/90 text-slate-800' 
        : 'border-slate-800/80 bg-[#0B1325]/90 text-slate-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-darkred via-darkred-700 to-amalfitile flex items-center justify-center shadow-glow-red">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`font-bold text-lg tracking-tight ${isCream ? 'text-slate-900' : 'text-white'}`}>
                MailMind
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-darkred/15 text-darkred-600 border border-darkred/30">
                Mediterranean Citrus
              </span>
            </div>
            <p className={`text-xs hidden sm:block ${isCream ? 'text-slate-600' : 'text-slate-400'}`}>
              AI Multi-Agent Gmail Assistant
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Switcher Toggle (Cream Gelato vs Amalfi Navy) */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
              isCream
                ? 'bg-amber-100/70 border-amber-300/80 text-amber-900 hover:bg-amber-200/80'
                : 'bg-amalfitile/20 border-amalfitile/40 text-seabreeze hover:bg-amalfitile/30'
            }`}
            title="Toggle between Mediterranean Cream and Amalfi Midnight theme"
          >
            {isCream ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Cream Gelato</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-seabreeze" />
                <span>Amalfi Navy</span>
              </>
            )}
          </button>

          <button
            onClick={onOpenStats}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              isCream
                ? 'bg-white border-amber-900/10 text-slate-700 hover:bg-amber-50 hover:text-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amalfitile" />
            <span className="hidden sm:inline">Proof Metrics</span>
          </button>

          <button
            onClick={onOpenFeedback}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
              isCream
                ? 'bg-white border-amber-900/10 text-slate-700 hover:bg-amber-50 hover:text-slate-900'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-citrus" />
            <span>Feedback</span>
          </button>

          <div className={`h-4 w-px ${isCream ? 'bg-amber-900/15' : 'bg-slate-800'}`} />

          {user && (
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-semibold ${
                isCream
                  ? 'bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-slate-800 border-slate-700 text-slate-200'
              }`}>
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-darkred transition rounded-lg"
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
