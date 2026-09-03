import React from 'react';
import { motion } from 'framer-motion';
import { Archive, Trash2, CheckCircle2, X, AlertTriangle, HardDrive, Mail } from 'lucide-react';

export default function BulkActionBar({
  selectedClusters = [],
  totalSelectedEmails = 0,
  totalSelectedStorageMb = 0,
  hasSensitiveSelected = false,
  isExecuting = false,
  onExecuteBulkAction,
  onClearSelection,
}) {
  if (selectedClusters.length === 0) return null;

  return (
    <motion.aside
      aria-label="Bulk action controls"
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
    >
      {/* Container structured with Amalfi Tile #2E5AA7 */}
      <div className="bg-[#1A3563] border-2 border-amalfitile rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
        
        {/* Left: Running Total Indicators */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-white">
            <Mail className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold font-mono text-white">
                {totalSelectedEmails.toLocaleString()} emails selected
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-200 border border-white/15">
                {selectedClusters.length} {selectedClusters.length === 1 ? 'cluster' : 'clusters'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
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

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onExecuteBulkAction('archive')}
            className="px-4 py-2.5 rounded-2xl bg-amalfitile hover:bg-amalfitile-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition transform active:scale-95 disabled:opacity-50 border border-white/20"
          >
            <Archive className="w-4 h-4" />
            <span>Archive All</span>
          </button>

          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onExecuteBulkAction('delete')}
            className="px-4 py-2.5 rounded-2xl bg-coralflame hover:bg-coralflame-hover text-white font-bold text-xs flex items-center gap-1.5 shadow-coral-alert transition transform active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Trash All</span>
          </button>

          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onExecuteBulkAction('keep')}
            className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition transform active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Keep</span>
          </button>

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
