import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, Archive, Trash2, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ActionQueueModal({ category, isOpen, onClose, onExecuteAction, isExecuting }) {
  const [selectedAction, setSelectedAction] = useState(category?.suggested_action || 'archive');

  if (!isOpen || !category) return null;

  const isDelete = selectedAction === 'delete';
  const isArchive = selectedAction === 'archive';
  const isKeep = selectedAction === 'keep';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#FDFBF5] border-2 border-[#EEDFB8] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amalfitile bg-amalfitile/10 px-2.5 py-1 rounded-full border border-amalfitile/25">
                Action Approval Queue
              </span>
              <h2 className="text-xl font-extrabold text-amalfitile-dark mt-2">
                {category.category_name}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                {category.total_count} emails affected • ~{category.estimated_size_mb} MB
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isExecuting}
              className="p-1.5 rounded-xl text-slate-500 hover:text-amalfitile hover:bg-white transition border border-transparent hover:border-[#EEDFB8]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Narrative Context */}
          <div className="bg-white rounded-2xl p-4 border border-[#EEDFB8] mb-5 text-xs text-slate-700 leading-relaxed shadow-sm">
            <span className="font-bold text-amalfitile-dark block mb-1">AI Triage Context:</span>
            {category.narrative_summary}
          </div>

          {/* Action Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Action to Approve:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedAction('archive')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  isArchive 
                    ? 'bg-amalfitile text-white shadow-sm border-amalfitile' 
                    : 'bg-white text-slate-600 hover:text-amalfitile border-[#EEDFB8]'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>Archive</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('delete')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  isDelete 
                    ? 'bg-coralflame text-white shadow-coral-alert border-coralflame' 
                    : 'bg-white text-slate-600 hover:text-coralflame border-[#EEDFB8]'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Trash</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAction('keep')}
                className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                  isKeep 
                    ? 'bg-emerald-600 text-white shadow-sm border-emerald-600' 
                    : 'bg-white text-slate-600 hover:text-emerald-700 border-[#EEDFB8]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Keep Inbox</span>
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EEDFB8]">
            <button
              type="button"
              onClick={onClose}
              disabled={isExecuting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-amalfitile transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isExecuting}
              onClick={() => onExecuteAction(category.cluster_id, selectedAction)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 text-white transition shadow-sm disabled:opacity-50 ${
                isDelete ? 'bg-coralflame hover:bg-coralflame-hover shadow-coral-alert' : 'bg-amalfitile hover:bg-amalfitile-hover'
              }`}
            >
              <span>{isExecuting ? 'Executing...' : `Confirm & ${selectedAction.toUpperCase()}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
