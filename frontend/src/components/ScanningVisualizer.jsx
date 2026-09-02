import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Layers, Cpu, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';

const STEPS = [
  { label: "OAuth Handshake & Fetch", icon: Mail },
  { label: "FAISS Vector Clustering", icon: Layers },
  { label: "LangGraph Multi-Agent Pipeline", icon: Cpu },
  { label: "Narrative & Action Synthesis", icon: Sparkles }
];

export default function ScanningVisualizer({ progress, message, emailsScanned }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (progress < 30) setCurrentStep(0);
    else if (progress < 60) setCurrentStep(1);
    else if (progress < 90) setCurrentStep(2);
    else setCurrentStep(3);
  }, [progress]);

  return (
    <div className="bg-gradient-to-b from-slate-900 via-indigo-950/20 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background glow animation */}
      <motion.div 
        className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Live Multi-Agent Scanning
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Active Run
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ingesting headers, generating semantic embeddings, and triaging clusters
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300 font-mono">
              {progress}%
            </span>
            <p className="text-xs text-slate-400">
              {emailsScanned} emails processed
            </p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-950/80 rounded-full h-3.5 p-0.5 border border-slate-800 mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeInOut", duration: 0.5 }}
          />
        </div>

        {/* Live Step Tracker */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isDone = idx < currentStep || progress === 100;

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10'
                    : isDone
                    ? 'bg-slate-900/60 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400 animate-spin-slow' : isDone ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className="text-xs font-semibold truncate">
                    {isDone ? '✓ Completed' : isActive ? 'Processing...' : `Step ${idx + 1}`}
                  </span>
                </div>
                <p className="text-[11px] font-medium leading-snug">{step.label}</p>
              </div>
            );
          })}
        </div>

        {/* Live Status Ticker */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono text-slate-400">Agent Log:</span>
            <span className="font-medium text-slate-200">{message}</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Read-only mode active
          </span>
        </div>
      </div>
    </div>
  );
}
