import React from 'react';
import { motion } from 'framer-motion';
import { Folder, Archive, Trash2, CheckCircle2, AlertCircle, HardDrive, ArrowUpRight } from 'lucide-react';

export default function FolderCard({ category, onSelectAction }) {
  const isKeep = category.suggested_action === 'keep';
  const isDelete = category.suggested_action === 'delete';
  const isArchive = category.suggested_action === 'archive';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-lg shadow-black/20 hover:shadow-indigo-500/5 transition-all group"
    >
      {/* Top Meta */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl border ${
              isKeep 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : isDelete 
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base leading-snug group-hover:text-indigo-300 transition">
                {category.category_name}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>{category.total_count} emails</span>
                <span>•</span>
                <span className={category.unread_count > 0 ? "text-amber-400 font-medium" : "text-slate-500"}>
                  {category.unread_count} unopened
                </span>
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1">
            <HardDrive className="w-3 h-3 text-slate-400" />
            ~{category.estimated_size_mb} MB
          </span>
        </div>

        {/* Narrative Summary */}
        <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 mb-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {category.narrative_summary}
          </p>
        </div>

        {/* Senders Sample */}
        {category.sample_senders && category.sample_senders.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {category.sample_senders.map((s, idx) => (
              <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/40 truncate max-w-[160px]">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Suggested Action Bar */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400">Agent recommendation:</span>
          <span className={`text-[11px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
            isKeep 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : isDelete 
              ? 'bg-rose-500/10 text-rose-400' 
              : 'bg-amber-500/10 text-amber-400'
          }`}>
            {category.suggested_action}
          </span>
        </div>

        <button
          onClick={() => onSelectAction(category)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
            isDelete
              ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30'
              : isArchive
              ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600 hover:text-white border border-amber-500/30'
              : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
          }`}
        >
          <span>Review</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
