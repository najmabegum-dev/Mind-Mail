import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Archive, Trash2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ActionQueueModal({ category, isOpen, onClose, onExecuteAction, isExecuting }) {
  const [selectedAction, setSelectedAction] = useState(category?.suggested_action || 'archive');

  if (!isOpen || !category) return null;

  const isDelete = selectedAction === 'delete';
  const isArchive = selectedAction === 'archive';
  const isKeep = selectedAction === 'keep';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                Action Approval Queue
              </span>
              <h2 className="text-xl font-bold text-white mt-2">
                {category.category_name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {category.total_count} emails affected • ~{category.estimated_size_mb} MB
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isExecuting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Narrative Reminder */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 mb-5 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-slate-200 block mb-1">AI Triage Context:</span>
            {category.narrative_summary}
          </div>

          {/* Action Selector */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Select Action to Approve:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction('archive')}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                  isArchive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md shadow-amber-500/10'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Archive className="w-4 h-4 text-amber-400" />
                <span>Archive</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('delete')}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                  isDelete
                    ? 'bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-500/10'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>30-Day Trash</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('keep')}
                className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition ${
                  isKeep
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Keep in Inbox</span>
              </button>
            </div>
          </div>

          {/* Safety Guarantee Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 mb-6">
            <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              {isDelete ? (
                <span><strong>Protected Action:</strong> Emails will be moved to Gmail Trash and remain recoverable for 30 days. No permanent wipe without review.</span>
              ) : isArchive ? (
                <span><strong>Safe Archive:</strong> Removes from primary inbox view while preserving full searchability in All Mail.</span>
              ) : (
                <span><strong>No Changes:</strong> Emails remain untouched in primary inbox.</span>
              )}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancel
            </button>

            <button
              onClick={() => onExecuteAction(category.cluster_id, selectedAction)}
              disabled={isExecuting}
              className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 text-white shadow-lg transition ${
                isDelete
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : isArchive
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
              } ${isExecuting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isExecuting ? (
                <span>Executing on Gmail...</span>
              ) : (
                <>
                  <span>Confirm & Execute</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
