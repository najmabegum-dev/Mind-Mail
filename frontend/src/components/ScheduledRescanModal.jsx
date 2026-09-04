import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, CheckCircle2, ShieldAlert, Sparkles, Lock, ArrowRight } from 'lucide-react';
import { tierApi } from '../services/api';

export default function ScheduledRescanModal({ isOpen, onClose, userTier = 'free', userId = 'demo-user-1', onOpenPricing }) {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState('weekly');
  const [preferredDay, setPreferredDay] = useState('Sunday');
  const [sendDigest, setSendDigest] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [nextRun, setNextRun] = useState('');

  const isAutopilot = userTier === 'autopilot';

  useEffect(() => {
    if (isOpen) {
      setSaveSuccess(false);
      tierApi.getScheduledRescan(userId)
        .then(res => {
          const d = res.data;
          setEnabled(d.enabled);
          setFrequency(d.frequency || 'weekly');
          setPreferredDay(d.preferred_day || 'Sunday');
          setSendDigest(d.send_email_digest);
          setNextRun(d.next_run || '');
        })
        .catch(err => console.error('Could not load rescan schedule', err));
    }
  }, [isOpen, userId]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAutopilot) {
      onClose();
      if (onOpenPricing) onOpenPricing();
      return;
    }

    setSaving(true);
    try {
      const res = await tierApi.updateScheduledRescan({
        user_id: userId,
        enabled,
        frequency,
        preferred_day: preferredDay,
        preferred_hour_utc: 6,
        send_email_digest: sendDigest
      });
      setNextRun(res.data.next_run);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save schedule', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className='bg-white border-2 border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8'
      >
        {/* Header */}
        <div className='flex items-start justify-between gap-4 pb-4 border-b border-slate-200'>
          <div className='flex items-center gap-3'>
            <div className='w-11 h-11 rounded-2xl bg-amalfitile flex items-center justify-center text-white shadow-amalfi-struct'>
              <Calendar className='w-6 h-6 text-citrus' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-lg font-extrabold text-slate-900 tracking-tight'>Scheduled Rescans & Digest</h2>
                <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amalfitile/15 text-amalfitile border border-amalfitile/30'>
                  Autopilot
                </span>
              </div>
              <p className='text-xs text-slate-500'>Keep your inbox organized automatically without manual clicks</p>
            </div>
          </div>

          <button onClick={onClose} className='p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition'>
            <X className='w-5 h-5' />
          </button>
        </div>

        {/* Tier Locked Banner if not Autopilot */}
        {!isAutopilot && (
          <div className='mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-3'>
            <Lock className='w-5 h-5 text-citrus-dark shrink-0 mt-0.5' />
            <div>
              <p className='font-bold'>Autopilot Exclusive Feature</p>
              <p className='text-slate-600 mt-0.5'>
                Automated weekly scans, auto-archive queues, and email digest summaries are available on the Autopilot tier (/mo).
              </p>
              <button
                type='button'
                onClick={() => { onClose(); if (onOpenPricing) onOpenPricing(); }}
                className='mt-2 px-3 py-1.5 rounded-xl bg-citrus text-slate-950 font-extrabold text-xs flex items-center gap-1 hover:bg-citrus-hover transition'
              >
                <span>Upgrade to Autopilot</span>
                <ArrowRight className='w-3.5 h-3.5' />
              </button>
            </div>
          </div>
        )}

        {/* Success Notice */}
        {saveSuccess && (
          <div className='mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2'>
            <CheckCircle2 className='w-4 h-4 text-emerald-600 shrink-0' />
            <span>Schedule preferences saved successfully! Next run: {nextRun}</span>
          </div>
        )}

        <form onSubmit={handleSave} className='mt-5 space-y-4 text-xs'>
          {/* Enable Toggle */}
          <div className='flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200'>
            <div>
              <span className='font-bold text-slate-900 block'>Enable Background Rescans</span>
              <span className='text-slate-500 text-[11px]'>Run autonomous multi-agent triage in the background</span>
            </div>
            <input
              type='checkbox'
              checked={enabled}
              disabled={!isAutopilot}
              onChange={(e) => setEnabled(e.target.checked)}
              className='w-4 h-4 text-citrus accent-citrus rounded focus:ring-citrus cursor-pointer'
            />
          </div>

          {/* Frequency Selector */}
          <div>
            <label className='font-bold text-slate-700 block mb-1'>Scan Frequency</label>
            <div className='grid grid-cols-3 gap-2'>
              {['weekly', 'biweekly', 'monthly'].map((f) => (
                <button
                  key={f}
                  type='button'
                  disabled={!isAutopilot}
                  onClick={() => setFrequency(f)}
                  className={'py-2 px-3 rounded-xl border text-center font-bold capitalize transition ' + (
                    frequency === f 
                      ? 'bg-amalfitile text-white border-amalfitile' 
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Day */}
          <div>
            <label className='font-bold text-slate-700 block mb-1'>Preferred Execution Day</label>
            <select
              value={preferredDay}
              disabled={!isAutopilot}
              onChange={(e) => setPreferredDay(e.target.value)}
              className='w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-citrus'
            >
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Send Digest Checkbox */}
          <div className='flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200'>
            <div>
              <span className='font-bold text-slate-900 block'>Weekly Email Digest</span>
              <span className='text-slate-500 text-[11px]'>Receive a Monday morning summary of storage freed and pending reviews</span>
            </div>
            <input
              type='checkbox'
              checked={sendDigest}
              disabled={!isAutopilot}
              onChange={(e) => setSendDigest(e.target.checked)}
              className='w-4 h-4 text-citrus accent-citrus rounded focus:ring-citrus cursor-pointer'
            />
          </div>

          {/* Footer CTA */}
          <div className='pt-3 border-t border-slate-200 flex items-center justify-between'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-slate-600 font-bold hover:text-slate-900 transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={saving}
              className='px-5 py-2.5 rounded-xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold transition shadow-sm'
            >
              {saving ? 'Saving...' : isAutopilot ? 'Save Preferences' : 'Upgrade to Configure'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
