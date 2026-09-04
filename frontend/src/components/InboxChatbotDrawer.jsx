import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Bot, Send, Sparkles, Lock, ArrowRight, 
  Mail, MessageSquare, AlertCircle, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { aiFeaturesApi } from '../services/api';

const SAMPLE_PROMPTS = [
  "Did I ever reply to the HR interview from Infosys?",
  "What paid subscriptions did I get charged for in the last 30 days?",
  "Are there any pending job offers or urgent recruiter notes?",
  "Which senders sent me the most unread clutter?"
];

export default function InboxChatbotDrawer({ 
  isOpen, 
  onClose, 
  currentTier = 'free', 
  userId = 'demo-user-1',
  onOpenPricing 
}) {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Hello! I am your Clarity Inbox Assistant. Ask me anything about your scanned emails, unread senders, interview replies, or subscriptions.",
      citations: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isLocked = currentTier === 'free';

  const handleSendMessage = async (queryToSend = inputQuery) => {
    const q = queryToSend.trim();
    if (!q || loading) return;

    if (isLocked) {
      if (onOpenPricing) onOpenPricing();
      return;
    }

    const userMsg = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await aiFeaturesApi.chatWithInbox({
        user_id: userId,
        query: q
      });

      const botMsg = {
        sender: 'bot',
        text: res.data.answer,
        citations: res.data.citations || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = {
        sender: 'bot',
        text: err.response?.data?.detail || "Sorry, I couldn't process your request. Please try again.",
        citations: []
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-full max-w-xl bg-white border-l-2 border-slate-200 h-full flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-5 border-b border-[#EEDFB8] bg-[#FDFBF5] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amalfitile flex items-center justify-center text-white shadow-amalfi-struct">
                <Bot className="w-5 h-5 text-citrus" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-amalfitile-dark tracking-tight">Inbox Q&A Chatbot</h2>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isLocked 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : 'bg-seabreeze/20 text-seabreeze-dark border-seabreeze/40'
                  }`}>
                    {isLocked ? 'Clarity Feature' : 'Active'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">Natural-language search over your scanned mailbox data</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-amalfitile hover:bg-white border border-transparent hover:border-[#EEDFB8] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Locked Teaser for Free Tier */}
          {isLocked ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Blurred dummy background */}
              <div className="absolute inset-0 p-6 space-y-4 filter blur-sm opacity-40 select-none pointer-events-none">
                <div className="bg-white p-4 rounded-2xl border border-[#EEDFB8] text-left text-xs">
                  <span className="font-bold text-slate-800">Did I reply to Infosys?</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-[#EEDFB8] text-left text-xs space-y-2">
                  <span className="font-bold text-amalfitile">Clarity Assistant:</span>
                  <p>You received an email from Infosys Careers on Aug 28th with subject "Interview Invitation". No outgoing reply was detected in your sent label.</p>
                </div>
              </div>

              {/* Floating Unlock Card */}
              <div className="relative z-10 bg-[#FDFBF5] border-2 border-amalfitile/40 rounded-3xl p-7 max-w-sm shadow-amalfi-struct space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amalfitile text-white flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-6 h-6 text-citrus" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-amalfitile-dark">Unlock Inbox Q&A</h3>
                  <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                    Search and question your inbox like a personal executive assistant. Available on the <strong>Clarity</strong> tier ($8/mo) and <strong>Autopilot</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenPricing) onOpenPricing();
                  }}
                  className="w-full py-3 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Upgrade to Clarity</span>
                </button>
              </div>
            </div>
          ) : (
            /* Active Chat Experience for Clarity & Autopilot */
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-4 text-xs font-medium leading-relaxed shadow-sm ${
                        m.sender === 'user'
                          ? 'bg-amalfitile text-white rounded-tr-sm'
                          : 'bg-white border border-[#EEDFB8] text-slate-800 rounded-tl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>

                      {/* Citations Box */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#EEDFB8] space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amalfitile block">
                            Direct Email Citations:
                          </span>
                          {m.citations.map((c, cIdx) => (
                            <div key={cIdx} className="bg-[#FDFBF5] p-2 rounded-xl border border-[#EEDFB8] text-[11px] text-slate-700">
                              <div className="flex items-center justify-between font-bold text-slate-900 mb-0.5">
                                <span className="truncate">{c.sender}</span>
                                <span className="text-[10px] text-slate-500">{c.date}</span>
                              </div>
                              <p className="font-extrabold text-amalfitile truncate mb-0.5">{c.subject}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1 italic">"{c.snippet}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amalfitile" />
                    <span>Analyzing scanned email threads...</span>
                  </div>
                )}
              </div>

              {/* Sample Prompts Chips */}
              <div className="px-4 py-2 bg-[#FDFBF5] border-t border-[#EEDFB8] overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 shrink-0">Try:</span>
                {SAMPLE_PROMPTS.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white hover:bg-seabreeze/10 text-slate-700 hover:text-amalfitile border border-[#EEDFB8] shrink-0 font-medium transition"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-4 border-t border-[#EEDFB8] bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask about your emails, senders, or threads..."
                  className="flex-1 bg-[#FDFBF5] border border-[#EEDFB8] rounded-2xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || loading}
                  className="p-2.5 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-bold shadow-citrus-hero border border-[#FFA62B] disabled:opacity-50 transition transform active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
