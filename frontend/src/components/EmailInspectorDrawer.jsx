import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Mail, ExternalLink, HardDrive, Calendar, Search, 
  Archive, Trash2, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw 
} from 'lucide-react';
import { categoriesApi } from '../services/api';

export default function EmailInspectorDrawer({ cluster, isOpen, onClose, onSelectAction }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    if (isOpen && cluster?.cluster_id) {
      setLoading(true);
      categoriesApi.getClusterEmails(cluster.cluster_id)
        .then(res => setEmails(res.data || []))
        .catch(err => console.error("Could not load cluster emails:", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, cluster]);

  if (!isOpen || !cluster) return null;

  const filteredEmails = emails.filter(e => {
    if (filter === 'unread' && e.is_read) return false;
    if (filter === 'read' && !e.is_read) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = (e.subject || '').toLowerCase().includes(q);
      const matchSender = (e.sender || '').toLowerCase().includes(q);
      const matchSnippet = (e.snippet || '').toLowerCase().includes(q);
      return matchSubject || matchSender || matchSnippet;
    }
    return true;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl relative"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Email Inspector
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ~{cluster.estimated_size_mb} MB
                </span>
              </div>
              <h2 className="text-lg font-bold text-white leading-tight">
                {cluster.category_name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Showing {emails.length} emails discovered in this cluster
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by subject, sender or keyword..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({emails.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === 'unread' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Unread ({emails.filter(e => !e.is_read).length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('read')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filter === 'read' ? 'bg-emerald-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Opened
              </button>
            </div>
          </div>

          {/* Emails Scroll List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-400">Fetching cluster email items...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                No emails matched your search criteria.
              </div>
            ) : (
              filteredEmails.map((email, idx) => (
                <div
                  key={email.id || idx}
                  className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${email.is_read ? 'bg-slate-600' : 'bg-amber-400'}`} />
                      <span className="font-semibold text-slate-200 text-xs truncate max-w-[280px]">
                        {email.sender}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-500 font-mono">
                      <Calendar className="w-3 h-3" />
                      <span>{email.date ? email.date.split('T')[0] : 'Recent'}</span>
                    </div>
                  </div>

                  <h4 className="text-xs font-medium text-white mb-1.5 line-clamp-1">
                    {email.subject || '(No Subject)'}
                  </h4>

                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {email.snippet || email.body || 'No preview available.'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                    <span className={`px-2 py-0.5 rounded ${
                      email.is_read ? 'bg-slate-900 text-slate-400' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {email.is_read ? 'Opened' : 'Unopened'}
                    </span>

                    {email.unsubscribe_url && (
                      <a
                        href={email.unsubscribe_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition"
                      >
                        <span>Unsubscribe Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              Agent Suggestion: <strong className="uppercase text-slate-200">{cluster.suggested_action}</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onSelectAction(cluster);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition"
              >
                <span>Review & Clean Cluster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
