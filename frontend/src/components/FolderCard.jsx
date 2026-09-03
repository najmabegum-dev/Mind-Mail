import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, Archive, Trash2, CheckCircle2, AlertCircle, 
  HardDrive, ArrowUpRight, Eye, ExternalLink, ShieldAlert,
  ChevronDown, ChevronUp, Check 
} from 'lucide-react';
import { actionsApi } from '../services/api';

export default function FolderCard({ category, onSelectAction, onInspect, onToast, theme = 'cream' }) {
  const isCream = theme === 'cream';
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
      className={`border rounded-2xl p-5 flex flex-col justify-between transition-all group min-h-[320px] ${
        isCream
          ? 'bg-white border-amber-900/15 shadow-md shadow-amber-950/5 hover:border-darkred/40 hover:shadow-lg'
          : 'bg-[#111D36]/90 border-[#1E3156] hover:border-amalfitile/50 shadow-lg shadow-black/20 hover:shadow-glow-blue'
      }`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl border ${
              category.needs_review
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-600'
                : isKeep 
                ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-600' 
                : isDelete 
                ? 'bg-darkred/15 border-darkred/30 text-darkred' 
                : 'bg-amalfitile/15 border-amalfitile/30 text-amalfitile'
            }`}>
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold text-sm leading-snug transition ${
                  isCream ? 'text-slate-900 group-hover:text-darkred' : 'text-white group-hover:text-seabreeze'
                }`}>
                  {category.category_name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className={`text-xs ${isCream ? 'text-slate-500' : 'text-slate-400'}`}>
                  {category.total_count} emails
                </span>
                <span className={isCream ? 'text-slate-300' : 'text-slate-600'}>•</span>
                <span className={category.unread_count > 0 ? "text-citrus font-semibold text-xs" : (isCream ? "text-slate-400 text-xs" : "text-slate-500 text-xs")}>
                  {category.unread_count} unopened
                </span>

                {category.needs_review && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-darkred/15 text-darkred border border-darkred/30 flex items-center gap-1 ml-1">
                    <ShieldAlert className="w-3 h-3 text-darkred" />
                    <span>Needs Review</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${
            isCream 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-slate-900 border-slate-700 text-slate-300'
          }`}>
            <HardDrive className="w-3 h-3 text-darkred" />
            ~{category.estimated_size_mb} MB
          </span>
        </div>

        {/* Structured Senders Breakdown with Standardized Max-Height to Prevent Grid Gaps */}
        {senders.length > 0 ? (
          <div className="space-y-2 mb-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
            {visibleSenders.map((s, idx) => {
              const isUnsubbed = unsubscribedUrls.includes(s.unsubscribe_url);
              const isPending = unsubscribingUrl === s.unsubscribe_url;

              return (
                <div key={idx} className={`p-3 rounded-xl border text-xs transition ${
                  isCream 
                    ? 'bg-[#F9F5EC] border-amber-900/10 text-slate-800' 
                    : 'bg-[#080E1C]/80 border-slate-800/80 text-slate-200'
                }`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`font-semibold flex items-center gap-1.5 truncate ${
                      isCream ? 'text-slate-900' : 'text-slate-100'
                    }`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-darkred shrink-0" />
                      <span className="truncate">{s.sender_name}</span>
                      <span className={`font-normal ${isCream ? 'text-slate-500' : 'text-slate-400'}`}>({s.count})</span>
                    </span>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {s.is_dead_subscription && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-darkred/15 text-darkred border border-darkred/25 font-medium">
                          Inactive
                        </span>
                      )}
                      {s.unread_count > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-citrus/20 text-citrus font-semibold border border-citrus/30">
                          {s.unread_count} unread
                        </span>
                      )}
                    </div>
                  </div>

                  <p className={`text-[11px] leading-relaxed pl-3 border-l-2 ${
                    isCream 
                      ? 'border-amber-300 text-slate-700' 
                      : 'border-slate-800 text-slate-300'
                  }`}>
                    {s.context}
                  </p>

                  {s.unsubscribe_url && (
                    <div className="mt-2 pl-3 flex items-center gap-2">
                      {isUnsubbed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                          <Check className="w-3 h-3" />
                          <span>Unsubscribed</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={(e) => handleUnsubscribe(e, s.unsubscribe_url)}
                          className="inline-flex items-center gap-1 text-[10px] text-darkred hover:text-darkred-700 font-semibold transition disabled:opacity-50"
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

            {/* Toggle to expand remaining senders without breaking grid alignment */}
            {senders.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAllSenders(!showAllSenders)}
                className="w-full py-1 text-center text-[11px] text-amalfitile hover:text-amalfitile-700 font-semibold transition flex items-center justify-center gap-1"
              >
                <span>{showAllSenders ? 'Show less' : `+${senders.length - 2} more senders`}</span>
                {showAllSenders ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        ) : (
          <div className={`rounded-xl p-3 border mb-3 ${
            isCream ? 'bg-[#F9F5EC] border-amber-900/10' : 'bg-[#080E1C]/60 border-slate-800/80'
          }`}>
            <p className={`text-xs leading-relaxed ${isCream ? 'text-slate-700' : 'text-slate-300'}`}>
              {category.narrative_summary}
            </p>
          </div>
        )}
      </div>

      {/* Suggested Action Bar & Inspector Trigger */}
      <div className={`pt-3 border-t flex items-center justify-between gap-2 mt-auto ${
        isCream ? 'border-amber-900/10' : 'border-slate-800/80'
      }`}>
        <button
          onClick={() => onInspect(category)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
            isCream 
              ? 'bg-amber-50/80 hover:bg-amber-100 border-amber-200 text-slate-700' 
              : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
          }`}
          title="Inspect specific emails in this cluster"
        >
          <Eye className="w-3.5 h-3.5 text-amalfitile" />
          <span>Inspect ({category.total_count})</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectAction(category)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              category.needs_review
                ? 'bg-citrus/20 text-citrus hover:bg-citrus hover:text-white border border-citrus/40'
                : isDelete
                ? 'bg-darkred/20 text-darkred hover:bg-darkred hover:text-white border border-darkred/30'
                : isArchive
                ? 'bg-amalfitile/20 text-amalfitile hover:bg-amalfitile hover:text-white border border-amalfitile/30'
                : 'bg-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-500/30'
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
