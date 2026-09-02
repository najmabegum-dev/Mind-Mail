import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, RefreshCw, FolderSearch, CheckCircle2, ShieldCheck, 
  Archive, Trash2, Filter, HardDrive, Mail, Layers 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FolderCard from '../components/FolderCard';
import ScanningVisualizer from '../components/ScanningVisualizer';
import ActionQueueModal from '../components/ActionQueueModal';
import FeedbackWidget from '../components/FeedbackWidget';
import StatsLeaderboard from '../components/StatsLeaderboard';
import { scanApi, categoriesApi, actionsApi } from '../services/api';

export default function DashboardPage({ user, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('Initializing agent scan...');
  const [emailsScanned, setEmailsScanned] = useState(0);
  
  const [selectedLimit, setSelectedLimit] = useState(500);
  
  // Modals state
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await categoriesApi.getCategories(user?.id || 'demo-user-1');
      setCategories(res.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const triggerScan = async () => {
    setIsScanning(true);
    setScanProgress(5);
    setScanMessage(`Connecting to Gmail for ${selectedLimit} emails...`);
    setEmailsScanned(0);

    try {
      await scanApi.triggerScan(user?.id || 'demo-user-1', selectedLimit);

      // Poll scan status until completion
      const interval = setInterval(async () => {
        try {
          const res = await scanApi.getScanStatus();
          const data = res.data;
          setScanProgress(data.progress_percentage);
          setScanMessage(data.message);
          setEmailsScanned(data.emails_scanned || 150);

          if (data.status === 'completed' || data.progress_percentage >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsScanning(false);
              fetchCategories();
              showToast("Scan completed! Discovered new narrative clusters.");
            }, 800);
          } else if (data.status === 'failed') {
            clearInterval(interval);
            setIsScanning(false);
            showToast("Scan encountered an issue.");
          }
        } catch (e) {
          console.error("Status poll error:", e);
        }
      }, 1000);
    } catch (err) {
      console.error("Error triggering scan:", err);
      setIsScanning(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenActionModal = (cat) => {
    setSelectedCategoryForAction(cat);
    setIsActionModalOpen(true);
  };

  const handleExecuteAction = async (clusterId, action) => {
    setIsExecutingAction(true);
    try {
      const res = await actionsApi.approveAction({
        cluster_id: clusterId,
        action: action,
        target_all_in_cluster: true
      });
      setIsActionModalOpen(false);
      showToast(res.data.message || "Action executed successfully.");
      // Refresh categories list
      fetchCategories();
    } catch (err) {
      console.error("Action error:", err);
      showToast("Could not complete action.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Aggregate stats across discovered categories
  const totalEmails = categories.reduce((acc, c) => acc + c.total_count, 0);
  const totalUnread = categories.reduce((acc, c) => acc + c.unread_count, 0);
  const totalStorageMb = categories.reduce((acc, c) => acc + c.estimated_size_mb, 0).toFixed(1);

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'actionable') return c.suggested_action === 'delete' || c.suggested_action === 'archive';
    if (activeFilter === 'keep') return c.suggested_action === 'keep';
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        user={user}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onLogout={onLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Toast Notification */}
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 right-6 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-indigo-400/40 text-xs font-semibold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}

        {/* Hero & Quick Actions Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gmail Connected (Read-Only)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Inbox Intelligence Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Semantic clusters and narrative AI summaries. Review suggestions safely before applying any actions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs">
              <span className="text-[11px] text-slate-400 pl-2 pr-1 font-medium">Scan Limit:</span>
              {[200, 500, 1000].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedLimit(num)}
                  disabled={isScanning}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                    selectedLimit === num
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {num} Mails
                </button>
              ))}
            </div>

            <button
              onClick={triggerScan}
              disabled={isScanning}
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition transform active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning in Progress...' : `Scan ${selectedLimit} Emails`}</span>
            </button>
          </div>
        </div>

        {/* Live Scanning Visualizer (Active during scan) */}
        {isScanning && (
          <ScanningVisualizer
            progress={scanProgress}
            message={scanMessage}
            emailsScanned={emailsScanned}
          />
        )}

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Emails Analyzed</span>
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">{totalEmails.toLocaleString()}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all clusters</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Unopened Backlog</span>
              <FolderSearch className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-bold text-amber-300 font-mono">{totalUnread.toLocaleString()}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalEmails > 0 ? `${Math.round((totalUnread / totalEmails) * 100)}% unopened` : '0%'}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Estimated Storage</span>
              <HardDrive className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">{totalStorageMb} MB</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Reclaimable space</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Clusters Discovered</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-emerald-300 font-mono">{categories.length}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Zero hardcoded rules</p>
          </div>
        </div>

        {/* Section Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Discovered Clusters & Narratives</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {filteredCategories.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Organic semantic groups extracted via LangGraph multi-agent pipeline
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition ${
                activeFilter === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Clusters
            </button>
            <button
              onClick={() => setActiveFilter('actionable')}
              className={`px-3 py-1 rounded-lg transition ${
                activeFilter === 'actionable' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Actionable (Archive/Trash)
            </button>
            <button
              onClick={() => setActiveFilter('keep')}
              className={`px-3 py-1 rounded-lg transition ${
                activeFilter === 'keep' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              Keep in Inbox
            </button>
          </div>
        </div>

        {/* Category Cards Grid */}
        {loadingCategories ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading clusters & narrative summaries...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
            <FolderSearch className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No clusters found for this filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try selecting "All Clusters" or rerun an agent scan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat) => (
              <FolderCard
                key={cat.cluster_id}
                category={cat}
                onSelectAction={handleOpenActionModal}
              />
            ))}
          </div>
        )}

      </main>

      {/* Action Approval Queue Modal */}
      <ActionQueueModal
        category={selectedCategoryForAction}
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onExecuteAction={handleExecuteAction}
        isExecuting={isExecutingAction}
      />

      {/* Feedback Widget Modal */}
      <FeedbackWidget
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Stats Leaderboard Modal */}
      <StatsLeaderboard
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />
    </div>
  );
}
