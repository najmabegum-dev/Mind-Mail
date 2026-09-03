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
  theme = 'cream',
}) {
  if (selectedClusters.length === 0) return null;
  const isCream = theme === 'cream';

  return (
    <motion.aside
      aria-label="Bulk action controls"
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4"
    >
      <div className={`border rounded-3xl p-4 sm:p-5 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors duration-300 ${
        isCream
          ? 'bg-white/95 border-darkred/40 shadow-2xl shadow-amber-950/15 text-slate-800'
          : 'bg-[#0B1325]/95 border-darkred/40 shadow-glow-red text-white'
      }`}>
        
        {/* Left: Running Total Indicators */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-darkred/15 border border-darkred/30 text-darkred">
            <Mail className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold font-mono ${isCream ? 'text-slate-900' : 'text-white'}`}>
                {totalSelectedEmails.toLocaleString()} emails selected
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${
                isCream 
                  ? 'bg-amber-50 text-slate-700 border-amber-200' 
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}>
                {selectedClusters.length} {selectedClusters.length === 1 ? 'cluster' : 'clusters'}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-amalfitile font-semibold flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{totalSelectedStorageMb.toFixed(1)} MB will be freed</span>
              </span>

              {hasSensitiveSelected && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-citrus/20 text-citrus font-semibold border border-citrus/30 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
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
            className="px-4 py-2.5 rounded-2xl bg-amalfitile hover:bg-amalfitile-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-amalfitile/25 transition transform active:scale-95 disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            <span>Archive All</span>
          </button>

          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onExecuteBulkAction('delete')}
            className="px-4 py-2.5 rounded-2xl bg-darkred hover:bg-darkred-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-glow-red transition transform active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Trash All</span>
          </button>

          <button
            type="button"
            disabled={isExecuting}
            onClick={() => onExecuteBulkAction('keep')}
            className={`px-4 py-2.5 rounded-2xl font-semibold text-xs flex items-center gap-1.5 transition transform active:scale-95 disabled:opacity-50 ${
              isCream
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Keep</span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className={`p-2 rounded-2xl transition ${
              isCream ? 'text-slate-400 hover:text-slate-800 hover:bg-amber-100' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
