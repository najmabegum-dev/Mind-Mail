import React from 'react';
import { motion } from 'framer-motion';
import { Archive, Trash2, CheckCircle2, X, AlertTriangle, HardDrive, Mail, Zap, Lock } from 'lucide-react';

export default function BulkActionBar({
  selectedClusters = [],
  totalSelectedEmails = 0,
  totalSelectedStorageMb = 0,
  hasSensitiveSelected = false,
  isExecuting = false,
  currentTier = 'free',
  usageInfo = null,
  onOpenPricing,
  onExecuteBulkAction,
  onClearSelection,
}) {
  if (selectedClusters.length === 0) return null;

  const isFree = currentTier === 'free';
  const actionsUsed = usageInfo?.action_count_this_period || 0;
  const freeLimit = 500;
  const willExceedFreeCap = isFree && (actionsUsed + totalSelectedEmails > freeLimit);

  const handleActionClick = (action) => {
    if (willExceedFreeCap && (action === 'archive' || action === 'delete')) {
      if (onOpenPricing) onOpenPricing();
      return;
    }
    onExecuteBulkAction(action);
  };

  return (
    <motion.aside
      aria-label="Bulk action controls"
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4"
    >
      {/* Container structured with Amalfi Tile #2E5AA7 */}
      <div className="bg-[#1A3563] border-2 border-amalfitile rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col lg:flex-row items-center justify-between gap-4 text-white">
        
        {/* Left: Running Total & Storage Freed */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-white shrink-0">
            <Mail className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold font-mono text-white">
                {totalSelectedEmails.toLocaleString()} emails selected
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                {selectedClusters.length} {selectedClusters.length === 1 ? 'cluster' : 'clusters'}
              </span>

              {/* Free Tier Quota Indicator */}
              {isFree ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  willExceedFreeCap 
                    ? 'bg-coralflame/30 text-coralflame border-coralflame/50' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span>{actionsUsed}/{freeLimit} free actions used</span>
                  {willExceedFreeCap && <Lock className="w-3 h-3 text-coralflame" />}
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-300" />
                  <span>Unlimited {currentTier.toUpperCase()}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {/* Hero counter in Citrus Zest #FFA62B */}
              <span className="text-xs text-citrus font-bold flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-citrus" />
                <span>{totalSelectedStorageMb.toFixed(1)} MB will be freed</span>
              </span>

              {/* Coral Flame #E8543F ONLY for Sensitive Warning */}
              {hasSensitiveSelected && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-coralflame/20 text-coralflame border border-coralflame/40 flex items-center gap-1 font-bold">
                  <AlertTriangle className="w-3 h-3 text-coralflame" />
                  <span>Sensitive items included</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action Buttons with Tier Warning */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {willExceedFreeCap ? (
            <button
              type="button"
              onClick={onOpenPricing}
              className="px-5 py-2.5 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95"
            >
              <Zap className="w-4 h-4" />
              <span>Upgrade for Unlimited Actions</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={isExecuting}
                onClick={() => handleActionClick('archive')}
                className="px-4 py-2.5 rounded-2xl bg-amalfitile hover:bg-amalfitile-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition transform active:scale-95 disabled:opacity-50 border border-white/20"
              >
                <Archive className="w-4 h-4" />
                <span>Archive All</span>
              </button>

              <button
                type="button"
                disabled={isExecuting}
                onClick={() => handleActionClick('delete')}
                className="px-4 py-2.5 rounded-2xl bg-coralflame hover:bg-coralflame-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-coral-alert transition transform active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Trash All</span>
              </button>

              <button
                type="button"
                disabled={isExecuting}
                onClick={() => handleActionClick('keep')}
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition transform active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Keep</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClearSelection}
            className="p-2 rounded-2xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
