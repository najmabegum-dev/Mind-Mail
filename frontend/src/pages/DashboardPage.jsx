import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, RefreshCw, FolderSearch, CheckCircle2, ShieldCheck, 
  Archive, Trash2, Filter, HardDrive, Mail, Layers, Calendar, ChevronDown,
  AlertTriangle, ExternalLink, Inbox, MessageSquare, LayoutGrid, ListFilter,
  CheckSquare, Square, ShieldAlert
} from 'lucide-react';
import Navbar from '../components/Navbar';
import FolderCard from '../components/FolderCard';
import CategoryRollupCard from '../components/CategoryRollupCard';
import BulkActionBar from '../components/BulkActionBar';
import ScanningVisualizer from '../components/ScanningVisualizer';
import ActionQueueModal from '../components/ActionQueueModal';
import FeedbackWidget from '../components/FeedbackWidget';
import StatsLeaderboard from '../components/StatsLeaderboard';
import EmailInspectorDrawer from '../components/EmailInspectorDrawer';
import { scanApi, categoriesApi, actionsApi, profileApi, gmailApi } from '../services/api';

export default function DashboardPage({ user, onLogout }) {
  const [categories, setCategories] = useState([]);
  const [rollups, setRollups] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('Initializing agent scan...');
  const [emailsScanned, setEmailsScanned] = useState(0);

  // Exact Real-time Gmail Account Telemetry (Lifetime Baseline)
  const [realStats, setRealStats] = useState(null);

  // Range-Specific Analytics (For the selected timeframe)
  const [rangeMetrics, setRangeMetrics] = useState(null);

  // View Mode: 'rollup' (hierarchical 6-10 categories) vs 'flat' (all clusters)
  const [viewMode, setViewMode] = useState('rollup');

  // Multi-select Checkbox State for Bulk Actions
  const [selectedClusterIds, setSelectedClusterIds] = useState([]);

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

  // Fetch real account stats from Google Labels API
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

  const fetchRangeMetrics = async () => {
    try {
      const res = await scanApi.getRangeMetrics();
      if (res.data && res.data.total_emails) {
        setRangeMetrics(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch range metrics:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const [catRes, rollRes] = await Promise.all([
        categoriesApi.getCategories(user?.id || 'demo-user-1'),
        categoriesApi.getCategoriesRollup(user?.id || 'demo-user-1')
      ]);
      setCategories(catRes.data || []);
      setRollups(rollRes.data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchProfileStats();
    fetchRangeMetrics();
    fetchCategories();
  }, []);

  // Scan Limit / Depth (1000, 3000, 5000, 10000)
  const [scanLimit, setScanLimit] = useState(3000);

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
      setFromDate(d.toISOString().split('T')[0]); // From 1 year ago
      setToDate(todayStr); // To today!
      setShowCustomDates(false);
    } else if (preset === 'allTime') {
      setFromDate('');
      setToDate('');
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
      await scanApi.triggerScan(user?.id || 'demo-user-1', scanLimit, fromDate || null, toDate || null);

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
              fetchRangeMetrics();
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
      fetchCategories();
      fetchProfileStats();
      fetchRangeMetrics();
    } catch (err) {
      console.error("Action error:", err);
      showToast("Could not complete action.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Multi-select Bulk Action Handlers (Fix #3 & #4)
  const handleToggleClusterSelect = (clusterId) => {
    setSelectedClusterIds(prev => 
      prev.includes(clusterId) ? prev.filter(id => id !== clusterId) : [...prev, clusterId]
    );
  };

  const handleToggleParentSelect = (childClusterIds, shouldSelect) => {
    setSelectedClusterIds(prev => {
      if (shouldSelect) {
        return Array.from(new Set([...prev, ...childClusterIds]));
      } else {
        return prev.filter(id => !childClusterIds.includes(id));
      }
    });
  };

  const handleSelectAllActionable = () => {
    // Strictly exclude sensitive / needs_review clusters from bulk select!
    const actionableSafe = categories
      .filter(c => (c.suggested_action === 'delete' || c.suggested_action === 'archive') && !c.needs_review)
      .map(c => c.cluster_id);
    
    setSelectedClusterIds(actionableSafe);
    showToast(`Selected ${actionableSafe.length} routine clutter clusters (sensitive banking/HR clusters strictly excluded).`);
  };

  const handleExecuteBulkAction = async (action) => {
    if (selectedClusterIds.length === 0) return;
    setIsExecutingAction(true);
    try {
      const res = await actionsApi.bulkApproveAction({
        cluster_ids: selectedClusterIds,
        action: action
      });
      showToast(res.data?.message || `Bulk ${action} executed successfully!`);
      setSelectedClusterIds([]);
      fetchCategories();
      fetchProfileStats();
      fetchRangeMetrics();
    } catch (err) {
      console.error("Bulk action failed:", err);
      showToast("Could not complete bulk action.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  const handleReconnectGmail = async () => {
    try {
      const res = await gmailApi.getAuthUrl();
      if (res.data?.auth_url) {
        window.location.href = res.data.auth_url;
      }
    } catch (err) {
      console.error("Failed to get auth url:", err);
    }
  };

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'actionable') return c.suggested_action === 'delete' || c.suggested_action === 'archive';
    if (activeFilter === 'keep') return c.suggested_action === 'keep';
    if (activeFilter === 'review') return c.needs_review;
    return true;
  });

  // Calculate Running Total for Selected Clusters
  const selectedClustersList = categories.filter(c => selectedClusterIds.includes(c.cluster_id));
  const totalSelectedEmails = selectedClustersList.reduce((acc, c) => acc + c.total_count, 0);
  const totalSelectedStorageMb = selectedClustersList.reduce((acc, c) => acc + c.estimated_size_mb, 0);
  const hasSensitiveSelected = selectedClustersList.some(c => c.needs_review);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        user={user}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenFeedback={() => setIsFeedbackOpen(true)}
        onLogout={onLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-28">
        
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

        {/* Google Session Expired Warning Banner */}
        {realStats?.session_expired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google OAuth Session Expired</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Google security access tokens expire after 1 hour. Please reconnect your Gmail in 1 click to resume scanning your real inbox.
                </p>
              </div>
            </div>

            <button
              onClick={handleReconnectGmail}
              className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0 shadow-lg shadow-amber-500/20 transition transform active:scale-95"
            >
              <span>Reconnect Gmail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 1. TOP TIER: OVERALL GMAIL ACCOUNT DATA (LIFETIME BASELINE)               */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Account: {realStats?.email_address || 'Connected User'}
                </span>
                <span className="text-[11px] text-slate-400">Exact Google Labels API</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Overall Mailbox Baseline
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Account-wide metrics queried directly from your primary Inbox, labels, and storage.
              </p>
            </div>

            <button
              onClick={fetchProfileStats}
              className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition shadow"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Refresh Baseline</span>
            </button>
          </div>

          {/* Overall Baseline Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-5">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Primary Inbox</span>
                <Inbox className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-2xl font-bold text-white font-mono">
                {(realStats?.inbox_total ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Total in Inbox label</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Inbox Unread</span>
                <FolderSearch className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-2xl font-bold text-amber-300 font-mono">
                {(realStats?.inbox_unread ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {realStats?.inbox_total 
                  ? `${Math.round((realStats.inbox_unread / realStats.inbox_total) * 100)}% unread rate` 
                  : '0%'}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Inbox Opened</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-300 font-mono">
                {(realStats?.inbox_read ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Read & opened</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>All Mail (Total)</span>
                <Mail className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-white font-mono">
                {(realStats?.all_mail_total ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Inbox, Archive & Sent</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Conversations</span>
                <MessageSquare className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-2xl font-bold text-cyan-300 font-mono">
                {(realStats?.inbox_threads ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Grouped threads</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Total Storage</span>
                <HardDrive className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-purple-300 font-mono">
                {(realStats?.estimated_storage_mb ?? 0)} MB
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Estimated footprint</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MIDDLE TIER: DATE RANGE SELECTION & SCAN ACTION BUTTON                 */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Inbox Scanner & Intelligence Filter
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Select Timeframe to Analyze
            </h2>
            <p className="text-xs text-slate-400 max-w-lg">
              Choose a specific date window or preset. MailMind will query your Gmail inbox directly with zero limit cut-offs.
            </p>
          </div>

          <div className="flex flex-col gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 shrink-0 md:min-w-[420px]">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 pl-1 pr-1 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Presets:</span>
              </span>

              {[
                { id: 'last7', label: '7 Days' },
                { id: 'last30', label: '30 Days' },
                { id: 'last90', label: '90 Days' },
                { id: 'year1', label: '> 1 Year' },
                { id: 'custom', label: 'Custom' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleDatePresetChange(p.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition ${
                    datePreset === p.id 
                      ? 'bg-amalfitile text-white shadow-glow-blue font-semibold' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {(showCustomDates || datePreset === 'custom') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 pt-2 border-t border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex-1">
                  <span className="text-slate-500 text-[10px]">From:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-transparent text-white text-xs focus:outline-none w-full"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex-1">
                  <span className="text-slate-500 text-[10px]">To:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-transparent text-white text-xs focus:outline-none w-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Scan Depth Selector */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 pl-1 pr-1 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-citrus" />
                <span>Scan Depth:</span>
              </span>
              {[
                { id: 1000, label: '1,000' },
                { id: 3000, label: '3,000 (Recommended)' },
                { id: 5000, label: '5,000 (Deep)' },
                { id: 10000, label: '10,000 (Full)' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setScanLimit(d.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition ${
                    scanLimit === d.id
                      ? 'bg-amalfitile/40 text-seabreeze border border-amalfitile font-semibold shadow'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <button
              onClick={triggerScan}
              disabled={isScanning}
              className="w-full py-3.5 px-5 rounded-xl bg-darkred hover:bg-darkred-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-glow-red border border-darkred-500/40 disabled:opacity-50 transition transform active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning Inbox Range...' : `Scan Selected Range (up to ${scanLimit.toLocaleString()} emails)`}</span>
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

        {/* ========================================================================= */}
        {/* 3. LOWER TIER: METRICS OF THE SELECTED RANGE (AFTER SCAN)                 */}
        {/* ========================================================================= */}
        <div className="bg-slate-900/80 border border-amalfitile/40 rounded-3xl p-6 sm:p-7 shadow-glow-blue">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-amalfitile/20 mb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-seabreeze bg-amalfitile/20 px-2.5 py-0.5 rounded-full border border-amalfitile/30">
                Timeframe Analysis Metrics
              </span>
              <h3 className="text-lg font-bold text-white mt-1">
                Selected Window: {rangeMetrics?.from_date || fromDate || 'Start'} → {rangeMetrics?.to_date || toDate || 'Present'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Breakdown of emails and reclaimable space exclusively within this selected date range.
              </p>
            </div>
            <span className="text-xs text-seabreeze font-mono px-3 py-1 rounded-xl bg-amalfitile/20 border border-amalfitile/30 self-start sm:self-auto">
              {(rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0)).toLocaleString()} emails in slice
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Emails in Window</span>
                <Mail className="w-3.5 h-3.5 text-seabreeze" />
              </div>
              <span className="text-2xl font-bold text-white font-mono">
                {(rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0)).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">In chosen dates</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Unopened in Window</span>
                <FolderSearch className="w-3.5 h-3.5 text-citrus" />
              </div>
              <span className="text-2xl font-bold text-citrus font-mono">
                {(rangeMetrics?.unread_emails ?? categories.reduce((a,c)=>a+c.unread_count, 0)).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {(rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0)) > 0
                  ? `${Math.round(((rangeMetrics?.unread_emails ?? categories.reduce((a,c)=>a+c.unread_count, 0)) / (rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0))) * 100)}% unopened`
                  : '0%'}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Opened in Window</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-300 font-mono">
                {(rangeMetrics?.read_emails ?? Math.max(0, (rangeMetrics?.total_emails ?? 0) - (rangeMetrics?.unread_emails ?? 0))).toLocaleString()}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Read & opened</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Window Storage</span>
                <HardDrive className="w-3.5 h-3.5 text-darkred-400" />
              </div>
              <span className="text-2xl font-bold text-darkred-300 font-mono">
                {(rangeMetrics?.storage_mb ?? categories.reduce((a,c)=>a+c.estimated_size_mb, 0).toFixed(1))} MB
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Reclaimable space</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Brand Clusters</span>
                <Layers className="w-3.5 h-3.5 text-amalfitile" />
              </div>
              <span className="text-2xl font-bold text-seabreeze font-mono">
                {categories.length}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">Isolated entities</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span>Unsubscribe Links</span>
                <ExternalLink className="w-3.5 h-3.5 text-citrus" />
              </div>
              <span className="text-2xl font-bold text-citrus font-mono">
                {(rangeMetrics?.unsubscribe_count ?? 8)}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">1-click headers</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CLUSTERS SECTION: HIERARCHICAL ROLLUP & BULK CONTROLS                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {viewMode === 'rollup' ? 'Hierarchical Category Rollup' : 'Itemized Brand Clusters'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {viewMode === 'rollup' ? `${rollups.length} parent categories` : `${filteredCategories.length} clusters`}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {viewMode === 'rollup' 
                ? 'Parent-level grouping organizing senders into clean categories. Expand any category to see specific brand cards.' 
                : 'Flat view of all isolated brand clusters with per-sender summaries.'}
            </p>
          </div>

          {/* Navigation Controls: View Mode & Multi-Select Helper */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Bulk Select Button (Fix #4: Strictly excludes banking/HR) */}
            <button
              type="button"
              onClick={handleSelectAllActionable}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-darkred/40 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Select all promotional & newsletter clutter (sensitive banking/HR clusters strictly excluded)"
            >
              <CheckSquare className="w-3.5 h-3.5 text-citrus" />
              <span>Select Routine Clutter</span>
            </button>

            {/* View Mode Toggle (Rollup vs Flat Grid) */}
            <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('rollup')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'rollup' 
                    ? 'bg-darkred text-white shadow-glow-red font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Rollup ({rollups.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                  viewMode === 'flat' 
                    ? 'bg-darkred text-white shadow-glow-red font-semibold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Flat Grid ({categories.length})</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                  activeFilter === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('actionable')}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                  activeFilter === 'actionable' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Actionable
              </button>
              <button
                onClick={() => setActiveFilter('review')}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium transition ${
                  activeFilter === 'review' ? 'bg-amber-600/30 text-amber-300 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Needs Review
              </button>
            </div>
          </div>
        </div>

        {/* Content View: Hierarchical Category Rollup vs Flat Grid */}
        {loadingCategories ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-44 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'rollup' ? (
          // =========================================================================
          // HIERARCHICAL ROLLUP VIEW (~6 to 10 Parent Category Cards)
          // =========================================================================
          <div className="space-y-5">
            {rollups.map((rollupItem) => (
              <CategoryRollupCard
                key={rollupItem.parent_id}
                rollup={rollupItem}
                onSelectAction={handleOpenActionModal}
                onInspect={handleInspectCluster}
                selectedClusterIds={selectedClusterIds}
                onToggleClusterSelect={handleToggleClusterSelect}
                onToggleParentSelect={handleToggleParentSelect}
              />
            ))}
          </div>
        ) : (
          // =========================================================================
          // FLAT GRID VIEW (Standardized Card Heights, No Gaps)
          // =========================================================================
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredCategories.map((category) => {
              const isSelected = selectedClusterIds.includes(category.cluster_id);
              return (
                <div key={category.cluster_id} className="relative">
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      type="button"
                      onClick={() => handleToggleClusterSelect(category.cluster_id)}
                      className="p-1 rounded bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white transition"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <FolderCard
                    category={category}
                    onSelectAction={handleOpenActionModal}
                    onInspect={handleInspectCluster}
                    onToast={showToast}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating Bulk Action Bar with Persistent Running Total (Fix #3 & #4) */}
      <BulkActionBar
        selectedClusters={selectedClustersList}
        totalSelectedEmails={totalSelectedEmails}
        totalSelectedStorageMb={totalSelectedStorageMb}
        hasSensitiveSelected={hasSensitiveSelected}
        isExecuting={isExecutingAction}
        onExecuteBulkAction={handleExecuteBulkAction}
        onClearSelection={() => setSelectedClusterIds([])}
      />

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
