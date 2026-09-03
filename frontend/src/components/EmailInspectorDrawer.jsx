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
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-2xl bg-[#FFFBF3] border-l border-[#EEDFB8] h-full flex flex-col shadow-2xl relative"
        >
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#EEDFB8] bg-[#FDFBF5] flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-seabreeze-dark bg-seabreeze/20 px-2.5 py-0.5 rounded-full border border-seabreeze/40">
                  Email Inspector
                </span>
                <span className="text-[11px] font-mono text-slate-500 font-medium">
                  ~{cluster.estimated_size_mb} MB
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-amalfitile-dark leading-tight">
                {cluster.category_name}
              </h2>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                Showing {emails.length} emails discovered in this cluster
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-amalfitile hover:bg-white transition border border-transparent hover:border-[#EEDFB8]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls: Search & Unread/Read Filter */}
          <div className="p-4 border-b border-[#EEDFB8]/80 bg-white flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subject, sender, snippet..."
                className="w-full bg-[#FDFBF5] border border-[#EEDFB8] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium"
              />
            </div>

            <div className="flex items-center gap-1 bg-[#FDFBF5] p-1 rounded-xl border border-[#EEDFB8] self-stretch sm:self-auto justify-center">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filter === 'all' ? 'bg-amalfitile text-white shadow-sm' : 'text-slate-600 hover:text-amalfitile'
                }`}
              >
                All ({emails.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filter === 'unread' ? 'bg-citrus text-slate-950 font-extrabold shadow-sm' : 'text-slate-600 hover:text-amalfitile'
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filter === 'read' ? 'bg-amalfitile text-white shadow-sm' : 'text-slate-600 hover:text-amalfitile'
                }`}
              >
                Read
              </button>
            </div>
          </div>

          {/* Email Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin text-amalfitile" />
                <span className="text-xs font-medium">Fetching message headers from Gmail...</span>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Mail className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-xs font-medium">No emails match the selected filters.</p>
              </div>
            ) : (
              filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className="bg-white border border-[#EEDFB8] hover:border-amalfitile/50 rounded-2xl p-4 transition shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2">
                      {!email.is_read && (
                        <span className="w-2 h-2 rounded-full bg-citrus shrink-0" title="Unread" />
                      )}
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {email.sender || 'Unknown Sender'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-500 shrink-0 font-medium">
                      {email.date ? new Date(email.date).toLocaleDateString() : ''}
                    </span>
                  </div>

                  <h4 className="text-xs font-extrabold text-amalfitile-dark mb-1 leading-snug">
                    {email.subject || '(No Subject)'}
                  </h4>

                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed font-medium">
                    {email.snippet}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[#EEDFB8] bg-[#FDFBF5] flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Ready to process this cluster?
            </span>

            <button
              onClick={() => {
                onClose();
                onSelectAction(cluster);
              }}
              className="px-4 py-2 rounded-xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-citrus-hero border border-[#FFA62B] transition"
            >
              <span>Take Action</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
