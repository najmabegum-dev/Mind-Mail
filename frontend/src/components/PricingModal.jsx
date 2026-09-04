import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Check, Sparkles, ShieldCheck, Zap, Bot, 
  Send, Key, ArrowRight, CheckCircle2, Lock 
} from 'lucide-react';
import { tierApi } from '../services/api';

const TIERS = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: '$0',
    priceAnnual: '$0',
    period: 'forever',
    description: 'Feel real space freed immediately. Full inbox scan with narrative clusters.',
    features: [
      'Full one-time read-only scan (any date range)',
      'Brand-level narrative cluster summaries',
      '500 bulk archive/delete actions per month',
      'RFC 8058 One-Click unsubscribe helper',
      'BYO API Key setting supported',
    ],
    notIncluded: [
      'Inbox Q&A Chatbot',
      'AI email writing & draft assistant',
      'Automated weekly rescans',
    ],
    ctaText: 'Current Plan',
    isPopular: false
  },
  {
    id: 'clarity',
    name: 'Clarity',
    priceMonthly: '$8',
    priceAnnual: '$59',
    period: 'per month',
    description: 'Complete freedom to clean and chat with your inbox data without limits.',
    features: [
      'Everything in Free, uncapped',
      'Unlimited bulk archive & delete actions',
      'Unlimited rescans & rolling 3-month window',
      'Inbox Q&A Chatbot (natural-language search)',
      'Exportable cleanup audit reports',
      'Priority multi-agent cluster routing',
    ],
    notIncluded: [
      'AI email writing & draft assistant',
      'Scheduled background rescans',
    ],
    ctaText: 'Upgrade to Clarity',
    isPopular: true
  },
  {
    id: 'autopilot',
    name: 'Autopilot',
    priceMonthly: '$18',
    priceAnnual: '$149',
    period: 'per month',
    description: 'AI drafts context-aware replies for review, plus automatic weekly maintenance.',
    features: [
      'Everything in Clarity, unlimited',
      'AI drafts emails from typed or voice instructions',
      'Mandatory Draft-then-Approve (never auto-sends)',
      'Scheduled weekly background rescans',
      'VIP latency & dedicated agent workers',
      'Phase-3 Attachment Offload preview access',
    ],
    notIncluded: [],
    ctaText: 'Upgrade to Autopilot',
    isPopular: false
  }
];

export default function PricingModal({ 
  isOpen, 
  onClose, 
  currentTier = 'free', 
  userId = 'demo-user-1',
  onTierUpdated,
  onToast 
}) {
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' or 'byo'
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
  const [upgradingTier, setUpgradingTier] = useState(null);

  // BYO Key Form
  const [byoProvider, setByoProvider] = useState('openai');
  const [byoKey, setByoKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);

  if (!isOpen) return null;

  const handleSelectTier = async (tierId) => {
    if (tierId === currentTier) return;
    setUpgradingTier(tierId);
    try {
      const res = await tierApi.upgradeTier({
        user_id: userId,
        tier: tierId,
        billing_cycle: billingCycle
      });
      if (onToast) onToast(`Switched to ${res.data.tier_name}!`);
      if (onTierUpdated) onTierUpdated(tierId);
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error("Upgrade error:", err);
      if (onToast) onToast("Could not complete plan update.");
    } finally {
      setUpgradingTier(null);
    }
  };

  const handleSaveByoKey = async (e) => {
    e.preventDefault();
    if (!byoKey.trim()) return;
    setSavingKey(true);
    try {
      const res = await tierApi.configureByoKey({
        user_id: userId,
        provider: byoProvider,
        api_key: byoKey.trim()
      });
      if (onToast) onToast(res.data.message || "BYO API key saved!");
      setByoKey('');
      if (onTierUpdated) onTierUpdated(currentTier);
    } catch (err) {
      console.error("BYO Key error:", err);
      if (onToast) onToast(err.response?.data?.detail || "Failed to save API key.");
    } finally {
      setSavingKey(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white border-2 border-slate-200 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative my-8"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#EEDFB8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amalfitile/10 text-amalfitile border border-amalfitile/25 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-citrus" />
                <span>Plans & Sustainable Pricing</span>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-amalfitile-dark tracking-tight">
              Choose the Plan That Powers Your Inbox
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Every plan frees space immediately. Upgrade for unlimited actions, interactive Q&A, and AI draft assistance.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-amalfitile hover:bg-[#FDFBF5] border border-transparent hover:border-[#EEDFB8] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Billing Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 my-6">
          <div className="flex items-center bg-[#FDFBF5] p-1 rounded-2xl border border-[#EEDFB8]">
            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'plans'
                  ? 'bg-amalfitile text-white shadow-sm'
                  : 'text-slate-600 hover:text-amalfitile'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Subscription Tiers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('byo')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'byo'
                  ? 'bg-amalfitile text-white shadow-sm'
                  : 'text-slate-600 hover:text-amalfitile'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-citrus" />
              <span>BYO API Key</span>
            </button>
          </div>

          {activeTab === 'plans' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className={billingCycle === 'monthly' ? 'text-amalfitile font-extrabold' : 'text-slate-500'}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'annual' : 'monthly')}
                className="w-12 h-6 rounded-full bg-[#EEDFB8] p-1 transition flex items-center"
              >
                <div className={`w-4 h-4 rounded-full bg-amalfitile transition transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
              <span className={billingCycle === 'annual' ? 'text-amalfitile font-extrabold' : 'text-slate-500'}>
                Annual <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">Save ~40%</span>
              </span>
            </div>
          )}
        </div>

        {/* Tab 1: 3-Tier Grid */}
        {activeTab === 'plans' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TIERS.map((tier) => {
              const isCurrent = tier.id === currentTier;
              const isProcessing = upgradingTier === tier.id;
              const price = billingCycle === 'annual' ? tier.priceAnnual : tier.priceMonthly;
              const cycleLabel = billingCycle === 'annual' ? '/year' : '/month';

              return (
                <div
                  key={tier.id}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                    tier.isPopular 
                      ? 'bg-white border-2 border-amalfitile shadow-amalfi-struct ring-2 ring-amalfitile/10' 
                      : 'bg-[#FDFBF5] border border-[#EEDFB8] shadow-sm'
                  }`}
                >
                  {tier.isPopular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] uppercase font-extrabold px-3 py-0.5 rounded-full bg-amalfitile text-white shadow-sm tracking-wider">
                      Most Popular
                    </span>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-extrabold text-amalfitile-dark">{tier.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Active Plan
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
                      {tier.description}
                    </p>

                    <div className="flex items-baseline gap-1 mb-5">
                      <span className="text-3xl font-extrabold text-slate-900 font-mono">{price}</span>
                      <span className="text-xs text-slate-500 font-bold">{tier.id === 'free' ? '' : cycleLabel}</span>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-2.5 pt-4 border-t border-[#EEDFB8]/70 mb-6">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Included Features:
                      </span>
                      {tier.features.map((f, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}

                      {tier.notIncluded.map((nf, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-400 font-normal">
                          <X className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                          <span className="line-through">{nf}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tier Action Button */}
                  <button
                    type="button"
                    disabled={isCurrent || isProcessing}
                    onClick={() => handleSelectTier(tier.id)}
                    className={`w-full py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition transform active:scale-95 disabled:opacity-50 ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 cursor-default'
                        : tier.isPopular
                        ? 'bg-citrus hover:bg-citrus-hover text-slate-950 shadow-citrus-hero border border-[#FFA62B]'
                        : 'bg-amalfitile hover:bg-amalfitile-hover text-white shadow-sm'
                    }`}
                  >
                    {isProcessing ? (
                      <span>Updating...</span>
                    ) : isCurrent ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Current Plan</span>
                      </>
                    ) : (
                      <>
                        <span>{tier.ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* Tab 2: BYO API Key Configuration */
          <div className="bg-[#FDFBF5] border border-[#EEDFB8] rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-amalfitile text-white shadow-amalfi-struct">
                <Key className="w-5 h-5 text-citrus" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-amalfitile-dark">Bring Your Own API Key (BYO-Key)</h3>
                <p className="text-xs text-slate-600 font-medium">Available across all tiers. Keeps heavy clustering & Q&A usage cost-sustainable.</p>
              </div>
            </div>

            <form onSubmit={handleSaveByoKey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">AI Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'openai', label: 'OpenAI (GPT-4o)' },
                    { id: 'gemini', label: 'Google Gemini' },
                    { id: 'anthropic', label: 'Anthropic Claude' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setByoProvider(p.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        byoProvider === p.id 
                          ? 'bg-amalfitile text-white border-amalfitile shadow-sm' 
                          : 'bg-white text-slate-700 border-[#EEDFB8] hover:border-amalfitile'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {byoProvider.toUpperCase()} Secret Key
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={byoKey}
                    onChange={(e) => setByoKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-white border border-[#EEDFB8] rounded-xl pl-10 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amalfitile font-mono shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Keys are stored encrypted with AES-256 and used exclusively for your account requests.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingKey}
                className="w-full py-3 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] transition transform active:scale-95 disabled:opacity-50"
              >
                <span>{savingKey ? 'Validating & Saving...' : 'Save Personal API Key'}</span>
                <Check className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Footer Guarantee */}
        <div className="mt-8 pt-4 border-t border-[#EEDFB8] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-amalfitile" />
            <span>Cancel or switch tiers anytime. Zero long-term lock-in.</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Powered by Stripe & Lemon Squeezy subscription infrastructure
          </span>
        </div>
      </motion.div>
    </div>
  );
}
