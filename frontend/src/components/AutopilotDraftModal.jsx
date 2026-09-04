import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Send, Mic, MicOff, Lock, 
  CheckCircle2, ArrowRight, ShieldAlert, Edit3, Save 
} from 'lucide-react';
import { aiFeaturesApi } from '../services/api';

export default function AutopilotDraftModal({ 
  isOpen, 
  onClose, 
  currentTier = 'free', 
  userId = 'demo-user-1',
  onOpenPricing,
  onToast 
}) {
  const [instruction, setInstruction] = useState('');
  const [recipient, setRecipient] = useState('');
  const [tone, setTone] = useState('professional');
  const [isListening, setIsListening] = useState(false);
  const [drafting, setDrafting] = useState(false);
  
  // Generated Draft for Mandatory Review
  const [generatedDraft, setGeneratedDraft] = useState(null);
  const [finalSubject, setFinalSubject] = useState('');
  const [finalBody, setFinalBody] = useState('');
  const [approving, setApproving] = useState(false);

  if (!isOpen) return null;

  const isLocked = currentTier !== 'autopilot';

  const handleToggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      if (onToast) onToast("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isListening) {
      setIsListening(true);
      recognition.start();
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInstruction(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } else {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleGenerateDraft = async (e) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    if (isLocked) {
      if (onOpenPricing) onOpenPricing();
      return;
    }

    setDrafting(true);
    try {
      const res = await aiFeaturesApi.generateDraft({
        user_id: userId,
        instruction: instruction.trim(),
        recipient_email: recipient.trim() || undefined,
        tone: tone
      });

      setGeneratedDraft(res.data);
      setFinalSubject(res.data.subject);
      setFinalBody(res.data.body);
    } catch (err) {
      console.error("Draft generation failed:", err);
      if (onToast) onToast(err.response?.data?.detail || "Could not generate draft.");
    } finally {
      setDrafting(false);
    }
  };

  const handleApproveAndSend = async (sendNow = false) => {
    if (!generatedDraft) return;
    setApproving(true);

    try {
      const res = await aiFeaturesApi.approveAndSendDraft({
        user_id: userId,
        draft_id: generatedDraft.draft_id,
        approved: true,
        final_subject: finalSubject,
        final_body: finalBody,
        send_now: sendNow
      });

      if (onToast) onToast(res.data.message || "Action completed!");
      setGeneratedDraft(null);
      setInstruction('');
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error("Approval error:", err);
      if (onToast) onToast("Failed to process approved draft.");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EEDFB8]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amalfitile flex items-center justify-center text-white shadow-amalfi-struct">
              <Sparkles className="w-6 h-6 text-citrus" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-amalfitile-dark tracking-tight">
                  Autopilot Draft Assistant
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isLocked 
                    ? 'bg-amber-100 text-amber-900 border-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}>
                  {isLocked ? 'Autopilot Exclusive' : 'Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Drafts in seconds from typed or voice notes • <strong>Send in one tap after review</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-amalfitile hover:bg-[#FDFBF5] border border-transparent hover:border-[#EEDFB8] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Locked Teaser for non-Autopilot users */}
        {isLocked ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-3xl bg-amalfitile/10 border border-amalfitile/25 flex items-center justify-center mx-auto text-amalfitile">
              <Lock className="w-7 h-7 text-citrus" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-extrabold text-amalfitile-dark">
                Autopilot Tier Feature ($18/mo)
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                Dictate or type quick instructions, and MailMind will synthesize ready-to-send replies. 
                Built with a strict <strong>Draft-then-approve</strong> safety guarantee — no email ever leaves your inbox without your explicit review.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenPricing) onOpenPricing();
              }}
              className="px-6 py-3 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs inline-flex items-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Unlock with Autopilot Plan</span>
            </button>
          </div>
        ) : !generatedDraft ? (
          /* Input Form: Type or Voice Dictate */
          <form onSubmit={handleGenerateDraft} className="space-y-4 pt-5">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">What should this email say?</label>
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border flex items-center gap-1 font-bold transition ${
                    isListening 
                      ? 'bg-coralflame text-white border-coralflame animate-pulse' 
                      : 'bg-white text-slate-700 border-[#EEDFB8] hover:border-amalfitile'
                  }`}
                >
                  {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-amalfitile" />}
                  <span>{isListening ? 'Listening...' : 'Voice Dictate'}</span>
                </button>
              </div>

              <textarea
                required
                rows={4}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="e.g. 'Tell Alex I reviewed the draft deck, looks solid but we need slide 4 numbers verified before Thursday 3 PM.'"
                className="w-full bg-white border border-[#EEDFB8] rounded-2xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium shadow-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipient (Optional)</label>
                <input
                  type="email"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full bg-white border border-[#EEDFB8] rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-white border border-[#EEDFB8] rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amalfitile font-bold shadow-sm"
                >
                  <option value="professional">Professional & Direct</option>
                  <option value="concise">Ultra-Concise</option>
                  <option value="friendly">Warm & Friendly</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={drafting || !instruction.trim()}
              className="w-full mt-2 py-3.5 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{drafting ? 'Synthesizing Email Draft...' : 'Generate Draft for Review'}</span>
            </button>
          </form>
        ) : (
          /* Mandatory Review Step (Draft-Then-Approve) */
          <div className="pt-5 space-y-4">
            {/* Mandatory Review Banner */}
            <div className="bg-amber-100/70 border border-amber-300 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-amber-950 font-medium">
              <ShieldAlert className="w-4 h-4 text-amber-800 shrink-0" />
              <span>
                <strong>Mandatory Review Step:</strong> MailMind never sends without your explicit confirmation. Review and edit the fields below before releasing.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                value={finalSubject}
                onChange={(e) => setFinalSubject(e.target.value)}
                className="w-full bg-white border border-[#EEDFB8] rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amalfitile shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Body (Editable)</label>
              <textarea
                rows={6}
                value={finalBody}
                onChange={(e) => setFinalBody(e.target.value)}
                className="w-full bg-white border border-[#EEDFB8] rounded-2xl p-3.5 text-xs text-slate-900 focus:outline-none focus:border-amalfitile font-mono shadow-sm leading-relaxed"
              />
            </div>

            <p className="text-[11px] text-slate-500 italic">
              AI Context: {generatedDraft.reasoning}
            </p>

            {/* Approval Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#EEDFB8]">
              <button
                type="button"
                onClick={() => setGeneratedDraft(null)}
                className="text-xs text-slate-600 hover:text-amalfitile font-bold"
              >
                ← Back to Instruction
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Save to Drafts */}
                <button
                  type="button"
                  disabled={approving}
                  onClick={() => handleApproveAndSend(false)}
                  className="px-4 py-2.5 rounded-xl border border-amalfitile bg-white hover:bg-seabreeze/10 text-amalfitile text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Gmail Drafts</span>
                </button>

                {/* Send in One Tap */}
                <button
                  type="button"
                  disabled={approving}
                  onClick={() => handleApproveAndSend(true)}
                  className="px-5 py-2.5 rounded-xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send in One Tap</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
