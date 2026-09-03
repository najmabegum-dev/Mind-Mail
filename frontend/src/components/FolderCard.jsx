import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, Archive, Trash2, CheckCircle2, 
  HardDrive, ArrowUpRight, Eye, ExternalLink, ShieldAlert,
  ChevronDown, ChevronUp, Check 
} from 'lucide-react';
import { actionsApi } from '../services/api';

export default function FolderCard({ category, onSelectAction, onInspect, onToast }) {
  const [showAllSenders, setShowAllSenders] = useState(false);
  const [unsubscribingUrl, setUnsubscribingUrl] = useState(null);
  const [unsubscribedUrls, setUnsubscribedUrls] = useState([]);

  const isKeep = category.suggested_action === 'keep';
  const isDelete = category.suggested_action === 'delete';
  const isArchive = category.suggested_action === 'archive';

  const senders = category.sender_breakdown || [];
  const visibleSenders = showAllSenders ? senders : senders.slice(0, 2);

  const handleUnsubscribe = async (e, url) => {
    e.stopPropagation();
    if (!url) return;
    setUnsubscribingUrl(url);

    try {
      const res = await actionsApi.unsubscribe({
        unsubscribe_url: url,
        one_click_post: true
      });

      if (res.data?.method === 'one_click_rfc8058') {
        setUnsubscribedUrls(prev => [...prev, url]);
        if (onToast) onToast("Successfully unsubscribed via RFC 8058 One-Click!");
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
        if (onToast) onToast("Opened verified sender unsubscribe page.");
      }
    } catch (err) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setUnsubscribingUrl(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-[#FDFBF5] border border-[#EEDFB8]/90 hover:border-amalfitile/50 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group min-h-[320px]"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            {/* Category Icon */}
            <div className={`p-2.5 rounded-xl border ${
              category.needs_review
                ? 'bg-coralflame/15 border-coralflame/30 text-coralflame'
                : 'bg-amalfitile/10 border-amalfitile/25 text-amalfitile'
            }`}>
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm leading-snug text-slate-900 group-hover:text-amalfitile transition">
                  {category.category_name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-xs text-slate-500 font-medium">
                  {category.total_count} emails
                </span>
                <span className="text-slate-300">•</span>
                <span className={category.unread_count > 0 ? "text-citrus font-bold text-xs" : "text-slate-400 text-xs"}>
                  {category.unread_count} unopened
                </span>

                {/* Coral Flame ONLY for Needs Review */}
                {category.needs_review && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coralflame/15 text-coralflame border border-coralflame/30 flex items-center gap-1 ml-1">
                    <ShieldAlert className="w-3 h-3 text-coralflame" />
                    <span>Needs Review</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md border border-[#EEDFB8] bg-white text-slate-700 flex items-center gap-1 shrink-0 font-medium">
            <HardDrive className="w-3 h-3 text-citrus" />
            ~{category.estimated_size_mb} MB
          </span>
        </div>

        {/* Structured Senders Breakdown */}
        {senders.length > 0 ? (
          <div className="space-y-2 mb-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {visibleSenders.map((s, idx) => {
              const isUnsubbed = unsubscribedUrls.includes(s.unsubscribe_url);
              const isPending = unsubscribingUrl === s.unsubscribe_url;

              return (
                <div key={idx} className="p-3 rounded-xl border border-[#EEDFB8]/60 bg-white text-xs text-slate-800 transition">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold flex items-center gap-1.5 truncate text-slate-900">
                      <span className="w-1.5 h-1.5 rounded-full bg-amalfitile shrink-0" />
                      <span className="truncate">{s.sender_name}</span>
                      <span className="font-normal text-slate-500">({s.count})</span>
                    </span>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.is_dead_subscription && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-bold">
                          Inactive
                        </span>
                      )}
                      {s.unread_count > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-citrus/15 text-citrus-dark font-bold border border-citrus/30">
                          {s.unread_count} unread
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed pl-3 border-l-2 border-seabreeze text-slate-600">
                    {s.context}
                  </p>

                  {s.unsubscribe_url && (
                    <div className="mt-2 pl-3 flex items-center gap-2">
                      {isUnsubbed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                          <Check className="w-3 h-3" />
                          <span>Unsubscribed</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={(e) => handleUnsubscribe(e, s.unsubscribe_url)}
                          className="inline-flex items-center gap-1 text-[10px] text-seabreeze-dark hover:text-amalfitile font-bold transition disabled:opacity-50"
                        >
                          <span>{isPending ? 'Unsubscribing...' : 'Unsubscribe'}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {senders.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllSenders(!showAllSenders)}
                className="w-full py-1 text-center text-[11px] text-amalfitile hover:text-amalfitile-hover font-bold transition flex items-center justify-center gap-1"
              >
                <span>{showAllSenders ? 'Show less' : `+${senders.length - 2} more senders`}</span>
                {showAllSenders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl p-3 border border-[#EEDFB8]/70 bg-white mb-3">
            <p className="text-xs leading-relaxed text-slate-700">
              {category.narrative_summary}
            </p>
          </div>
        )}
      </div>

      {/* Suggested Action Bar & Inspector Trigger */}
      <div className="pt-3 border-t border-[#EEDFB8]/80 flex items-center justify-between gap-2 mt-auto">
        <button
          onClick={() => onInspect(category)}
          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-seabreeze/40 bg-white hover:bg-seabreeze/10 text-seabreeze-dark transition flex items-center gap-1.5"
          title="Inspect specific emails in this cluster"
        >
          <Eye className="w-3.5 h-3.5 text-amalfitile" />
          <span>Inspect ({category.total_count})</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectAction(category)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
              category.needs_review
                ? 'bg-coralflame text-white hover:bg-coralflame-hover shadow-coral-alert'
                : isKeep
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                : 'bg-amalfitile text-white hover:bg-amalfitile-hover shadow-sm'
            }`}
          >
            <span className="capitalize">{category.needs_review ? 'Review' : category.suggested_action}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
