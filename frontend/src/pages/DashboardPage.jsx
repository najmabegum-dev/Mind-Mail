import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, RefreshCw, FolderSearch, CheckCircle2, ShieldCheck, 
  Archive, Trash2, Filter, HardDrive, Mail, Layers, Calendar, ChevronDown 
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FolderCard from '../components/FolderCard';
import ScanningVisualizer from '../components/ScanningVisualizer';
import ActionQueueModal from '../components/ActionQueueModal';
import FeedbackWidget from '../components/FeedbackWidget';
import StatsLeaderboard from '../components/StatsLeaderboard';
import EmailInspectorDrawer from '../components/EmailInspectorDrawer';
import { scanApi, categoriesApi, actionsApi, profileApi } from '../services/api';

export default function DashboardPage({ user, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('Initializing agent scan...');
  const [emailsScanned, setEmailsScanned] = useState(0);

  // Real-time Gmail Account Telemetry
  const [realStats, setRealStats] = useState(null);

  // Date Range Filtering State
  const [datePreset, setDatePreset] = useState('last30');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Modals & Drawer State
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState(null);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState(null);

  // Email Inspector State
  const [inspectCluster, setInspectCluster] = useState(null);
  const [isInspectDrawerOpen, setIsInspectDrawerOpen] = useState(false);

  // Fetch real account stats
  const fetchProfileStats = async () => {
    try {
      const res = await profileApi.getStats(user?.id || 'demo-user-1');
      if (res.data) {
        setRealStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch live profile telemetry:", err);
    }
  };

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
    fetchProfileStats();
    fetchCategories();
  }, []);

  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
      setShowCustomDates(false);
    } else if (preset === 'last30') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
      setShowCustomDates(false);
    } else if (preset === 'last90') {
      const d = new Date();
      d.setDate(d.getDate() - 90);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(todayStr);
      setShowCustomDates(false);
    } else if (preset === 'year1') {
      const d = new Date();
      d.setDate(d.getDate() - 365);
      setFromDate(''); // No lower bound
      setToDate(d.toISOString().split('T')[0]); // Before 1 year ago
      setShowCustomDates(false);
    } else if (preset === 'custom') {
      setShowCustomDates(true);
    }
  };

  const triggerScan = async () => {
    setIsScanning(true);
    setScanProgress(5);
    const rangeLabel = fromDate || toDate ? `${fromDate || 'Start'} to ${toDate || 'Present'}` : 'selected timeframe';
    setScanMessage(`Connecting to Gmail for ${rangeLabel}...`);
    setEmailsScanned(0);

    try {
      await scanApi.triggerScan(user?.id || 'demo-user-1', 1000, fromDate || null, toDate || null);

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
              fetchProfileStats();
              showToast("Scan completed! Discovered structured clusters.");
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

  const handleInspectCluster = (cat) => {
    setInspectCluster(cat);
    setIsInspectDrawerOpen(true);
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
      // Refresh categories and account stats
      fetchCategories();
      fetchProfileStats();
    } catch (err) {
      console.error("Action error:", err);
      showToast("Could not complete action.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Aggregated or Live Metrics
  const totalEmailsCount = realStats?.total_messages ?? categories.reduce((acc, c) => acc + c.total_count, 0);
  const totalUnreadCount = realStats?.unread_messages ?? categories.reduce((acc, c) => acc + c.unread_count, 0);
  const totalOpenedCount = realStats?.read_messages ?? Math.max(0, totalEmailsCount - totalUnreadCount);
  const totalStorageMb = realStats?.estimated_storage_mb ?? categories.reduce((acc, c) => acc + c.estimated_size_mb, 0).toFixed(1);

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

        {/* Hero & Date Range Calendar Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Gmail Live Connected ({realStats?.email_address || 'Read-Only'})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Inbox Intelligence Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Strict brand separation, sender-by-sender contextual digests, and one-click actions.
            </p>
          </div>

          {/* Date Range Selector & Trigger */}
          <div className="flex flex-col gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-[11px] text-slate-400 pl-1 pr-1 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Date Range:</span>
              </span>

              {[
                { id: 'last7', label: '7 Days' },
                { id: 'last30', label: '30 Days' },
                { id: 'last90', label: '90 Days' },
                { id: 'year1', label: '> 1 Year' },
                { id: 'custom', label: 'Custom Calendar' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleDatePresetChange(p.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                    datePreset === p.id 
                      ? 'bg-indigo-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Inputs (shown when custom selected or toggleable) */}
            {(showCustomDates || datePreset === 'custom') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 pt-1 border-t border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">From:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-transparent text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px]">To:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-transparent text-white text-xs focus:outline-none"
                  />
                </div>
              </motion.div>
            )}

            <button
              onClick={triggerScan}
              disabled={isScanning}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition transform active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Inbox Range...' : 'Scan Selected Range'}</span>
            </button>
          </div>
        </div>

        {/* Live Scanning Visualizer */}
        {isScanning && (
          <ScanningVisualizer
            progress={scanProgress}
            message={scanMessage}
            emailsScanned={emailsScanned}
          />
        )}

        {/* Live Account-Wide Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Inbox Messages</span>
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">{totalEmailsCount.toLocaleString()}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Real Gmail account total</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Unopened Backlog</span>
              <FolderSearch className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-bold text-amber-300 font-mono">{totalUnreadCount.toLocaleString()}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {totalEmailsCount > 0 ? `${Math.round((totalUnreadCount / totalEmailsCount) * 100)}% unread rate` : '0%'}
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Estimated Storage</span>
              <HardDrive className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">{totalStorageMb} MB</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Footprint in mailbox</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Discovered Clusters</span>
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-emerald-300 font-mono">{categories.length}</span>
            <p className="text-[11px] text-slate-500 mt-0.5">Isolated brand groupings</p>
          </div>
        </div>

        {/* Section Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Discovered Brand Clusters</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {filteredCategories.length}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each card contains structured sender bullet points with specific contextual digests.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                activeFilter === 'all' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Clusters
            </button>
            <button
              onClick={() => setActiveFilter('actionable')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                activeFilter === 'actionable' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Actionable (Archive/Trash)
            </button>
            <button
              onClick={() => setActiveFilter('keep')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                activeFilter === 'keep' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Keep in Inbox
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        {loadingCategories ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-slate-800/80">
            <FolderSearch className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No clusters found in this filter</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Run a scan or switch filters to view your structured email clusters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <FolderCard
                key={category.cluster_id}
                category={category}
                onSelectAction={handleOpenActionModal}
                onInspect={handleInspectCluster}
              />
            ))}
          </div>
        )}
      </main>

      {/* Action Queue Confirmation Modal */}
      <ActionQueueModal
        category={selectedCategoryForAction}
        isOpen={isActionModalOpen}
        isExecuting={isExecutingAction}
        onClose={() => setIsActionModalOpen(false)}
        onConfirm={handleExecuteAction}
      />

      {/* Interactive Email Inspector Drawer */}
      <EmailInspectorDrawer
        cluster={inspectCluster}
        isOpen={isInspectDrawerOpen}
        onClose={() => setIsInspectDrawerOpen(false)}
        onSelectAction={handleOpenActionModal}
      />

      {/* Feedback Widget Modal */}
      <FeedbackWidget
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmitSuccess={() => showToast("Feedback submitted. Thank you!")}
      />

      {/* Storage & Action Stats Modal */}
      <StatsLeaderboard
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />
    </div>
  );
}
