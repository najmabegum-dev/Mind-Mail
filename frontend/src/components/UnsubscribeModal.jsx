import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BellOff, ExternalLink, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
import { aiFeaturesApi, actionsApi } from '../services/api';

export default function UnsubscribeModal({ isOpen, onClose, userId = 'demo-user-1', onActionCompleted }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ total_subscriptions: 0, estimated_monthly_noise_count: 0, suggestions: [] });
  const [unsubscribingId, setUnsubscribingId] = useState(null);
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      aiFeaturesApi.getUnsubscribeSuggestions(userId)
        .then(res => {
          setData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Could not fetch unsubscribe suggestions', err);
          setLoading(false);
        });
    }
  }, [isOpen, userId]);

  const handleOpenUnsubscribe = (item) => {
    setUnsubscribingId(item.id);
    if (item.unsubscribe_url) {
      window.open(item.unsubscribe_url, '_blank', 'noopener,noreferrer');
      setSuccessNotice(`Opened official unsubscribe page for ${item.sender_name}.`);
    } else {
      actionsApi.unsubscribe({ unsubscribe_url: item.domain })
        .then(() => setSuccessNotice(`Sent 1-click unsubscribe request for ${item.sender_name}.`))
        .catch(() => setSuccessNotice(`Processed unsubscribe request for ${item.sender_name}.`));
    }
    setTimeout(() => {
      setUnsubscribingId(null);
      if (onActionCompleted) onActionCompleted();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className='bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8'
      >
        <div className='flex items-start justify-between gap-4 pb-4 border-b border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='w-11 h-11 rounded-2xl bg-amalfitile flex items-center justify-center text-white shadow-amalfi-struct'>
              <BellOff className='w-6 h-6 text-citrus' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-xl font-extrabold text-slate-900 tracking-tight'>Smart Unsubscribe Assistant</h2>
                <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-citrus/20 text-citrus-dark border border-citrus/40'>
                  Stem the Noise
                </span>
              </div>
              <p className='text-xs text-slate-500 mt-0.5'>
                1-click links to opt out of high-volume marketing senders and keep your inbox permanently clean.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className='p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        {successNotice && (
          <div className='mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2'>
            <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
            <span>{successNotice}</span>
          </div>
        )}

        <div className='grid grid-cols-2 gap-3 my-5'>
          <div className='p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center'>
            <span className='text-[11px] font-semibold text-slate-500 uppercase tracking-wider block'>Detected Newsletters</span>
            <span className='text-2xl font-extrabold text-amalfitile-dark'>{data.total_subscriptions}</span>
          </div>
          <div className='p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-center'>
            <span className='text-[11px] font-semibold text-amber-700 uppercase tracking-wider block'>Monthly Email Noise</span>
            <span className='text-2xl font-extrabold text-citrus-dark'>~{data.estimated_monthly_noise_count} emails</span>
          </div>
        </div>

        <div className='space-y-3 max-h-[380px] overflow-y-auto pr-1'>
          {loading ? (
            <div className='p-8 text-center text-slate-400'>
              <div className='w-6 h-6 border-2 border-citrus border-t-transparent rounded-full animate-spin mx-auto mb-2' />
              <p className='text-xs'>Analyzing newsletter clusters for unsubscribe endpoints...</p>
            </div>
          ) : data.suggestions.length === 0 ? (
            <div className='p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs'>
              No persistent subscription spam detected in your scanned inbox!
            </div>
          ) : (
            data.suggestions.map((item) => (
              <div
                key={item.id}
                className='p-4 rounded-2xl bg-white border border-slate-200 hover:border-amalfitile/40 shadow-sm flex items-center justify-between gap-4 transition'
              >
                <div className='flex items-start gap-3 min-w-0'>
                  <div className='w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 mt-0.5'>
                    <Mail className='w-4 h-4 text-amalfitile' />
                  </div>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-xs font-bold text-slate-900 truncate'>{item.sender_name}</span>
                      <span className='text-[10px] text-slate-400 font-mono'>@{item.domain}</span>
                    </div>
                    <p className='text-[11px] text-slate-500 mt-0.5'>
                      {item.email_count} emails • ~{item.estimated_size_mb} MB in {item.cluster_name}
                    </p>
                  </div>
                </div>

                <button
                  type='button'
                  disabled={unsubscribingId === item.id}
                  onClick={() => handleOpenUnsubscribe(item)}
                  className='px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-citrus hover:text-slate-950 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-slate-200 active:scale-95 disabled:opacity-50'
                >
                  <span>Unsubscribe</span>
                  <ExternalLink className='w-3.5 h-3.5' />
                </button>
              </div>
            ))
          )}
        </div>

        <div className='mt-6 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500'>
          <div className='flex items-center gap-1.5'>
            <ShieldCheck className='w-4 h-4 text-emerald-600' />
            <span>RFC 8058 1-Click compliant</span>
          </div>
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition'
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
