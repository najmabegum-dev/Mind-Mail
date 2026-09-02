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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquareHeart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Community Feedback & Notes</h2>
              <p className="text-xs text-slate-400">Share your thoughts to refine our agent pipeline</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-base font-semibold text-white">Thank you for your feedback!</h3>
            <p className="text-xs text-slate-400 mt-1">Your testimonial helps make the agents smarter.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-xs text-slate-400 mr-2">Your Experience:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 focus:outline-none transition"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                required
                placeholder="What surprised you about your inbox? Any clusters misclassified?"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-3 resize-none"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !message.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Send Feedback'}</span>
                </button>
              </div>
            </form>

            {/* Testimonials List */}
            {testimonials.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Recent User Reviews
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {testimonials.map((t, idx) => (
                    <div key={idx} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex text-amber-400">
                          {Array.from({ length: t.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500">Verified User</span>
                      </div>
                      <p className="text-slate-300 italic">"{t.message}"</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
