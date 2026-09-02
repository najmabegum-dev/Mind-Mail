import React from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, Archive, Trash2, CheckCircle2, AlertCircle, 
  HardDrive, ArrowUpRight, Eye, ExternalLink, ShieldAlert 
} from 'lucide-react';

export default function FolderCard({ category, onSelectAction, onInspect }) {
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
      {/* Top Header */}
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
              <h3 className="font-semibold text-slate-100 text-sm leading-snug group-hover:text-indigo-300 transition">
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

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 flex items-center gap-1 shrink-0">
            <HardDrive className="w-3 h-3 text-slate-400" />
            ~{category.estimated_size_mb} MB
          </span>
        </div>

        {/* Structured Senders Breakdown (Bullet Points) */}
        {category.sender_breakdown && category.sender_breakdown.length > 0 ? (
          <div className="space-y-2 mb-4">
            {category.sender_breakdown.map((s, idx) => (
              <div key={idx} className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-xs">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span className="truncate">{s.sender_name}</span>
                    <span className="text-slate-400 font-normal">({s.count})</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {s.is_dead_subscription && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                        Inactive
                      </span>
                    )}
                    {s.unread_count > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {s.unread_count} unread
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-800">
                  {s.context}
                </p>

                {s.unsubscribe_url && (
                  <div className="mt-1.5 pl-3">
                    <a
                      href={s.unsubscribe_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-rose-400 hover:text-rose-300 font-medium transition"
                    >
                      <span>Unsubscribe</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 mb-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              {category.narrative_summary}
            </p>
          </div>
        )}
      </div>

      {/* Suggested Action Bar & Inspector Trigger */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onInspect(category)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition flex items-center gap-1.5"
          title="Inspect specific emails in this cluster"
        >
          <Eye className="w-3.5 h-3.5 text-indigo-400" />
          <span>Inspect ({category.total_count})</span>
        </button>

        <div className="flex items-center gap-2">
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
            <span className="capitalize">{category.suggested_action}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
