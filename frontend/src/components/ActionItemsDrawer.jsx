import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Clock, AlertCircle, Calendar, Sparkles, ArrowRight, FileText } from 'lucide-react';
import { aiFeaturesApi } from '../services/api';

export default function ActionItemsDrawer({ isOpen, onClose, userId = 'demo-user-1', onOpenDraftModal }) {
  const [loading, setLoading] = useState(true);
  const [actionItems, setActionItems] = useState([]);
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      aiFeaturesApi.getActionItems(userId)
        .then(res => {
          setActionItems(res.data.action_items || []);
          setUrgentCount(res.data.urgent_count || 0);
          setLoading(false);
        })
        .catch(err => {
          console.error('Could not fetch action items', err);
          setLoading(false);
        });
    }
  }, [isOpen, userId]);

  const handleDraftClick = (item) => {
    onClose();
    if (onOpenDraftModal) {
      onOpenDraftModal({
        instruction: 'Reply to: ' + item.subject + ' regarding ' + item.action_description,
        recipient_email: item.sender_email,
        reply_to_email_id: item.email_id
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-sm flex justify-end'>
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className='w-full max-w-xl bg-white border-l-2 border-slate-200 h-full flex flex-col shadow-2xl relative'
      >
        {/* Header */}
        <div className='p-5 border-b border-slate-200 flex items-center justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-2xl bg-amalfitile flex items-center justify-center text-white shadow-amalfi-struct'>
              <CheckCircle2 className='w-5 h-5 text-citrus' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-lg font-extrabold text-slate-900 tracking-tight'>Action Items & Deadlines</h2>
                {urgentCount > 0 && (
                  <span className='text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-coralflame/15 text-coralflame border border-coralflame/30'>
                    {urgentCount} Urgent
                  </span>
                )}
              </div>
              <p className='text-xs text-slate-500'>Extracted obligations, interview requests, and invoices due</p>
            </div>
          </div>

          <button onClick={onClose} className='p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition'>
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Action Items List */}
        <div className='flex-1 overflow-y-auto p-5 space-y-4'>
          {loading ? (
            <div className='h-full flex flex-col items-center justify-center text-slate-400'>
              <div className='w-7 h-7 border-2 border-citrus border-t-transparent rounded-full animate-spin mb-3' />
              <p className='text-xs font-semibold'>Extracting pending action items & deadlines...</p>
            </div>
          ) : actionItems.length === 0 ? (
            <div className='p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs'>
              All clear! No urgent deadlines or pending invoices detected in your inbox.
            </div>
          ) : (
            actionItems.map((item) => (
              <div
                key={item.id}
                className={'p-4 rounded-2xl border transition-all shadow-sm ' + (
                  item.urgency === 'high' 
                    ? 'bg-amber-50/40 border-amber-300/80 hover:border-amber-400' 
                    : 'bg-slate-50/70 border-slate-200 hover:border-amalfitile/40'
                )}
              >
                <div className='flex items-start justify-between gap-3 mb-2'>
                  <div className='flex items-center gap-2 min-w-0'>
                    {item.urgency === 'high' ? (
                      <span className='px-2 py-0.5 rounded-md bg-coralflame/15 text-coralflame text-[10px] font-extrabold flex items-center gap-1 shrink-0'>
                        <AlertCircle className='w-3 h-3' />
                        Urgent
                      </span>
                    ) : (
                      <span className='px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 shrink-0'>
                        <Clock className='w-3 h-3' />
                        Pending
                      </span>
                    )}
                    <span className='text-xs font-bold text-slate-900 truncate'>{item.sender}</span>
                  </div>
                  <span className='text-[10px] text-slate-400 shrink-0'>{item.date}</span>
                </div>

                <h3 className='text-xs font-extrabold text-slate-900 mb-1 leading-snug'>{item.subject}</h3>
                <p className='text-xs text-slate-600 mb-3 leading-relaxed'>{item.action_description}</p>

                <div className='flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs'>
                  {item.deadline ? (
                    <div className='flex items-center gap-1 text-[11px] font-semibold text-amber-800'>
                      <Calendar className='w-3.5 h-3.5 text-citrus' />
                      <span>Due: {item.deadline}</span>
                    </div>
                  ) : <div />}

                  {item.needs_draft && (
                    <button
                      type='button'
                      onClick={() => handleDraftClick(item)}
                      className='px-3 py-1.5 rounded-xl bg-amalfitile hover:bg-amalfitile-hover text-white font-bold text-xs flex items-center gap-1 transition shadow-sm'
                    >
                      <Sparkles className='w-3 h-3 text-citrus' />
                      <span>Draft Reply</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500'>
          <span>Extracted via LangGraph Triage Agents</span>
          <button onClick={onClose} className='px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition'>
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
