import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Layers, Cpu, Mail } from 'lucide-react';

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
    <div className="bg-[#FDFBF5] border-2 border-amalfitile/30 rounded-3xl p-6 sm:p-8 shadow-amalfi-struct relative overflow-hidden">
      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amalfitile flex items-center justify-center text-white shadow-amalfi-struct">
              <Sparkles className="w-6 h-6 animate-pulse text-citrus" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-amalfitile-dark tracking-tight flex items-center gap-2">
                Live Multi-Agent Scanning
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amalfitile/15 text-amalfitile border border-amalfitile/30 font-bold">
                  Active Run
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Ingesting headers, generating semantic embeddings, and triaging clusters
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl font-extrabold text-citrus-dark font-mono">
              {progress}%
            </span>
            <p className="text-xs text-slate-600 font-medium">
              {emailsScanned} emails processed
            </p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-[#FBF6E9] rounded-full h-3.5 p-0.5 border border-[#EEDFB8] mb-6 overflow-hidden shadow-inner">
          <motion.div
            className="h-full bg-gradient-to-r from-amalfitile via-seabreeze to-citrus rounded-full"
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
                className={`p-3 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-white border-amalfitile text-amalfitile-dark shadow-sm'
                    : isDone
                    ? 'bg-white border-emerald-500/40 text-emerald-700'
                    : 'bg-white/60 border-[#EEDFB8]/70 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-citrus animate-spin-slow' : isDone ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold truncate">
                    {isDone ? '✓ Done' : isActive ? 'Processing...' : `Step ${idx + 1}`}
                  </span>
                </div>
                <p className="text-[11px] font-semibold leading-snug">{step.label}</p>
              </div>
            );
          })}
        </div>

        {/* Live Status Ticker */}
        <div className="bg-white border border-[#EEDFB8] rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-citrus animate-ping" />
            <span className="font-bold text-amalfitile">Agent Log:</span>
            <span className="font-medium text-slate-800">{message}</span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline font-medium">
            Read-only mode active
          </span>
        </div>
      </div>
    </div>
  );
}
