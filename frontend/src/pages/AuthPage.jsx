import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Lock, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authApi } from '../services/api';

export default function AuthPage({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isSignup) {
        res = await authApi.signup({
          email,
          password,
          display_name: displayName || 'Inbox Explorer',
          phone: phone || null,
        });
      } else {
        res = await authApi.login({ email, password });
      }

      const userData = res.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('access_token', res.data.access_token);
      onAuthSuccess(userData);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-warmwhite">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-[#FDFBF5] border border-[#EEDFB8] rounded-3xl p-8 shadow-sm backdrop-blur-md relative"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-amalfitile mx-auto flex items-center justify-center shadow-amalfi-struct mb-3 text-white">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-amalfitile-dark tracking-tight">MailMind</h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            AI Multi-Agent Gmail Sorting & Cleanup Assistant
          </p>
        </div>

        {/* Auth Toggle */}
        <div className="flex bg-white p-1 rounded-2xl border border-[#EEDFB8] mb-6 shadow-sm">
          <button
            type="button"
            onClick={() => setIsSignup(true)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              isSignup ? 'bg-amalfitile text-white shadow-sm' : 'text-slate-600 hover:text-amalfitile'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => setIsSignup(false)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              !isSignup ? 'bg-amalfitile text-white shadow-sm' : 'text-slate-600 hover:text-amalfitile'
            }`}
          >
            Sign In
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-coralflame/15 border border-coralflame/30 text-coralflame-dark font-semibold text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isSignup && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Najma"
                  className="w-full bg-white border border-[#EEDFB8] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium shadow-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address <span className="text-citrus">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com"
                className="w-full bg-white border border-[#EEDFB8] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password <span className="text-citrus">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#EEDFB8] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium shadow-sm"
              />
            </div>
          </div>

          {isSignup && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number <span className="text-slate-400 text-[10px] font-normal">(Optional for verification)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white border border-[#EEDFB8] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-medium shadow-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] disabled:opacity-50 transition transform active:scale-95"
          >
            <span>{loading ? 'Authenticating...' : isSignup ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security badge */}
        <div className="mt-6 pt-4 border-t border-[#EEDFB8]/70 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-amalfitile" />
          <span>AES-256 encrypted credential tokens</span>
        </div>
      </motion.div>
    </div>
  );
}
