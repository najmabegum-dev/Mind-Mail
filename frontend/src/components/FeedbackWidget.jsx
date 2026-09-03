import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import { feedbackApi } from '../services/api';

export default function FeedbackWidget({ isOpen, onClose }) {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    if (isOpen) {
      feedbackApi.getFeedback()
        .then(res => setTestimonials(res.data || []))
        .catch(err => console.error("Could not fetch feedback", err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    try {
      await feedbackApi.submitFeedback({ message, rating });
      setSubmitted(true);
      setMessage('');
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Feedback submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#FDFBF5] border-2 border-[#EEDFB8] rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-citrus/15 text-citrus-dark border border-citrus/30">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-amalfitile-dark">Community Feedback & Notes</h2>
              <p className="text-xs text-slate-600 font-medium">Share your thoughts to refine our agent pipeline</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-amalfitile">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">Feedback Submitted!</h3>
            <p className="text-xs text-slate-600 font-medium">Thank you for making MailMind better.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Experience Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-citrus transition"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'text-citrus fill-citrus' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Feedback / Suggestions</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What worked well? What categories were misidentified?"
                className="w-full bg-white border border-[#EEDFB8] rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </form>
        )}

        {/* Community Testimonials */}
        {testimonials.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#EEDFB8]">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Recent Community Insights</h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {testimonials.slice(0, 3).map((t, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-xl border border-[#EEDFB8]/70 text-xs text-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-amalfitile-dark">{t.user_email || 'Community Member'}</span>
                    <span className="text-citrus font-bold text-[10px]">★ {t.rating}/5</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">{t.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
