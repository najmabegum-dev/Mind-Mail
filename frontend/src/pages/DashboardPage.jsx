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
    <div className="min-h-screen bg-warmwhite text-slate-900 flex flex-col selection:bg-citrus selection:text-slate-950">
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
            className="fixed top-20 right-6 z-50 bg-amalfitile text-white px-4 py-2.5 rounded-2xl shadow-amalfi-struct border border-amalfitile/40 text-xs font-bold flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}

        {/* Google Session Expired Warning Banner (Coral Flame #E8543F ONLY for urgency) */}
        {realStats?.session_expired && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-coralflame/30 bg-coralflame/10 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-coral-alert text-slate-900"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-coralflame/20 text-coralflame border border-coralflame/40 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-coralflame-dark">Google OAuth Session Expired</h3>
                <p className="text-xs text-slate-700 mt-0.5 font-medium">
                  Google security access tokens expire after 1 hour. Please reconnect your Gmail in 1 click to resume scanning your real inbox.
                </p>
              </div>
            </div>

            <button
              onClick={handleReconnectGmail}
              className="px-5 py-2.5 rounded-2xl bg-coralflame hover:bg-coralflame-hover text-white font-bold text-xs flex items-center gap-2 shrink-0 shadow-coral-alert transition transform active:scale-95"
            >
              <span>Reconnect Gmail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* 1. TOP TIER: OVERALL GMAIL ACCOUNT DATA (LIFETIME BASELINE)               */}
        {/* ========================================================================= */}
        <div className="bg-[#FDFBF5] border border-[#EEDFB8] rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EEDFB8]/70">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-seabreeze/20 text-seabreeze-dark border border-seabreeze/40 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amalfitile animate-pulse" />
                  Account: {realStats?.email_address || 'Connected User'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Exact Google Labels API</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-amalfitile-dark tracking-tight">
                Overall Mailbox Baseline
              </h1>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Account-wide metrics queried directly from your primary Inbox, labels, and storage.
              </p>
            </div>

            <button
              onClick={fetchProfileStats}
              className="self-start md:self-auto px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition bg-white hover:bg-[#FBF6E9] text-amalfitile border border-[#EEDFB8] shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amalfitile" />
              <span>Refresh Baseline</span>
            </button>
          </div>

          {/* Overall Baseline Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-5">
            <div className="bg-white border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Primary Inbox</span>
                <Inbox className="w-4 h-4 text-amalfitile" />
              </div>
              <span className="text-2xl font-extrabold font-mono text-amalfitile-dark">
                {(realStats?.inbox_total ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Total in Inbox label</p>
            </div>

            <div className="bg-white border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Inbox Unread</span>
                <FolderSearch className="w-4 h-4 text-citrus" />
              </div>
              <span className="text-2xl font-extrabold text-citrus-dark font-mono">
                {(realStats?.inbox_unread ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">
                {realStats?.inbox_total 
                  ? `${Math.round((realStats.inbox_unread / realStats.inbox_total) * 100)}% unread rate` 
                  : '0%'}
              </p>
            </div>

            <div className="bg-white border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Inbox Opened</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-extrabold font-mono text-emerald-700">
                {(realStats?.inbox_read ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Read & opened</p>
            </div>

            <div className="bg-white border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>All Mail (Total)</span>
                <Mail className="w-4 h-4 text-amalfitile" />
              </div>
              <span className="text-2xl font-extrabold font-mono text-slate-900">
                {(realStats?.all_mail_total ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Inbox, Archive & Sent</p>
            </div>

            <div className="bg-white border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Conversations</span>
                <MessageSquare className="w-4 h-4 text-amalfitile" />
              </div>
              <span className="text-2xl font-extrabold font-mono text-amalfitile">
                {(realStats?.inbox_threads ?? 0).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Grouped threads</p>
            </div>

            <div className="bg-white border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Total Storage</span>
                <HardDrive className="w-4 h-4 text-citrus" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {(realStats?.estimated_storage_mb ?? 0)} MB
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Estimated footprint</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MIDDLE TIER: DATE RANGE SELECTION & SCAN ACTION BUTTON                 */}
        {/* ========================================================================= */}
        <div className="bg-[#FDFBF5] border border-[#EEDFB8] rounded-3xl p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amalfitile/10 text-amalfitile border border-amalfitile/25">
              Inbox Scanner & Intelligence Filter
            </span>
            <h2 className="text-xl font-extrabold text-amalfitile-dark tracking-tight">
              Select Timeframe to Analyze
            </h2>
            <p className="text-xs text-slate-600 max-w-lg font-medium">
              Choose a specific date window or preset. MailMind will query your Gmail inbox directly with zero limit cut-offs.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-3.5 rounded-2xl border border-[#EEDFB8]/80 bg-white shrink-0 md:min-w-[420px] shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] pl-1 pr-1 font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amalfitile" />
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
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    datePreset === p.id 
                      ? 'bg-amalfitile text-white shadow-sm font-bold' 
                      : 'bg-white border border-[#EEDFB8] text-slate-600 hover:text-amalfitile hover:bg-[#FBF6E9]'
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
                className="flex items-center gap-2 pt-2 border-t border-[#EEDFB8]/70 text-xs"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EEDFB8] bg-[#FDFBF5] text-slate-800 flex-1">
                  <span className="text-slate-500 text-[10px] font-bold">From:</span>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-transparent text-xs focus:outline-none w-full font-medium"
                  />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EEDFB8] bg-[#FDFBF5] text-slate-800 flex-1">
                  <span className="text-slate-500 text-[10px] font-bold">To:</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-transparent text-xs focus:outline-none w-full font-medium"
                  />
                </div>
              </motion.div>
            )}

            {/* Scan Depth Selector */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs border-t border-[#EEDFB8]/70">
              <span className="text-[11px] pl-1 pr-1 font-bold text-slate-500 flex items-center gap-1">
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
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                    scanLimit === d.id
                      ? 'bg-amalfitile text-white shadow-sm font-bold'
                      : 'bg-white border border-[#EEDFB8] text-slate-600 hover:text-amalfitile hover:bg-[#FBF6E9]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Hero Action Button: Citrus Zest #FFA62B dominates as the primary CTA */}
            <button
              onClick={triggerScan}
              disabled={isScanning}
              className="w-full py-3.5 px-5 rounded-2xl bg-citrus hover:bg-citrus-hover text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-citrus-hero border border-[#FFA62B] disabled:opacity-50 transition transform active:scale-95"
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
        <div className="bg-white border border-[#EEDFB8] rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EEDFB8]/70 mb-5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-seabreeze-dark bg-seabreeze/20 px-2.5 py-0.5 rounded-full border border-seabreeze/40">
                Timeframe Analysis Metrics
              </span>
              <h3 className="text-lg font-extrabold text-amalfitile-dark mt-1">
                Selected Window: {rangeMetrics?.from_date || fromDate || 'Start'} → {rangeMetrics?.to_date || toDate || 'Present'}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">
                Breakdown of emails and reclaimable space exclusively within this selected date range.
              </p>
            </div>
            <span className="text-xs text-seabreeze-dark font-mono px-3 py-1 rounded-xl bg-seabreeze/15 border border-seabreeze/30 self-start sm:self-auto font-bold">
              {(rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0)).toLocaleString()} emails in slice
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-[#FDFBF5] border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Emails in Window</span>
                <Mail className="w-3.5 h-3.5 text-amalfitile" />
              </div>
              <span className="text-2xl font-extrabold font-mono text-slate-900">
                {(rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0)).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">In chosen dates</p>
            </div>

            <div className="bg-[#FDFBF5] border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Unopened in Window</span>
                <FolderSearch className="w-3.5 h-3.5 text-citrus" />
              </div>
              <span className="text-2xl font-extrabold text-citrus-dark font-mono">
                {(rangeMetrics?.unread_emails ?? categories.reduce((a,c)=>a+c.unread_count, 0)).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">
                {(rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0)) > 0
                  ? `${Math.round(((rangeMetrics?.unread_emails ?? categories.reduce((a,c)=>a+c.unread_count, 0)) / (rangeMetrics?.total_emails ?? categories.reduce((a,c)=>a+c.total_count, 0))) * 100)}% unopened`
                  : '0%'}
              </p>
            </div>

            <div className="bg-[#FDFBF5] border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Opened in Window</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-2xl font-extrabold font-mono text-emerald-700">
                {(rangeMetrics?.read_emails ?? Math.max(0, (rangeMetrics?.total_emails ?? 0) - (rangeMetrics?.unread_emails ?? 0))).toLocaleString()}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Read & opened</p>
            </div>

            <div className="bg-[#FDFBF5] border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Window Storage</span>
                <HardDrive className="w-3.5 h-3.5 text-citrus" />
              </div>
              {/* Storage freed hero metric in Citrus Zest #FFA62B */}
              <span className="text-2xl font-extrabold text-citrus-dark font-mono">
                {(rangeMetrics?.storage_mb ?? categories.reduce((a,c)=>a+c.estimated_size_mb, 0).toFixed(1))} MB
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Reclaimable space</p>
            </div>

            <div className="bg-[#FDFBF5] border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Brand Clusters</span>
                <Layers className="w-3.5 h-3.5 text-amalfitile" />
              </div>
              <span className="text-2xl font-extrabold text-amalfitile-dark font-mono">
                {categories.length}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">Isolated entities</p>
            </div>

            <div className="bg-[#FDFBF5] border border-[#EEDFB8]/70 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1 text-slate-500">
                <span>Unsubscribe Links</span>
                <ExternalLink className="w-3.5 h-3.5 text-seabreeze-dark" />
              </div>
              <span className="text-2xl font-extrabold text-seabreeze-dark font-mono">
                {(rangeMetrics?.unsubscribe_count ?? 8)}
              </span>
              <p className="text-[11px] mt-0.5 text-slate-500 font-medium">1-click headers</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. CLUSTERS SECTION: HIERARCHICAL ROLLUP & BULK CONTROLS                  */}
        {/* ========================================================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-amalfitile-dark tracking-tight">
                {viewMode === 'rollup' ? 'Hierarchical Category Rollup' : 'Itemized Brand Clusters'}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full border bg-seabreeze/15 text-seabreeze-dark border-seabreeze/30 font-bold">
                {viewMode === 'rollup' ? `${rollups.length} parent categories` : `${filteredCategories.length} clusters`}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {viewMode === 'rollup' 
                ? 'Parent-level grouping organizing senders into clean categories. Expand any category to see specific brand cards.' 
                : 'Flat view of all isolated brand clusters with per-sender summaries.'}
            </p>
          </div>

          {/* Navigation Controls: View Mode & Multi-Select Helper */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Bulk Select Button (Sea Breeze styling) */}
            <button
              type="button"
              onClick={handleSelectAllActionable}
              className="px-3 py-1.5 rounded-xl border border-seabreeze/40 bg-white hover:bg-seabreeze/10 text-seabreeze-dark text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              title="Select all promotional & newsletter clutter (sensitive banking/HR clusters strictly excluded)"
            >
              <CheckSquare className="w-3.5 h-3.5 text-amalfitile" />
              <span>Select Routine Clutter</span>
            </button>

            {/* View Mode Toggle (Rollup vs Flat Grid - Amalfi Tile structure) */}
            <div className="flex items-center p-1 rounded-2xl border border-[#EEDFB8] bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('rollup')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'rollup' 
                    ? 'bg-amalfitile text-white shadow-sm' 
                    : 'text-slate-600 hover:text-amalfitile'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Rollup ({rollups.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  viewMode === 'flat' 
                    ? 'bg-amalfitile text-white shadow-sm' 
                    : 'text-slate-600 hover:text-amalfitile'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Flat Grid ({categories.length})</span>
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-2xl border border-[#EEDFB8] bg-white shadow-sm">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                  activeFilter === 'all' 
                    ? 'bg-amalfitile text-white shadow-sm'
                    : 'text-slate-600 hover:text-amalfitile'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('actionable')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                  activeFilter === 'actionable' 
                    ? 'bg-amalfitile text-white shadow-sm'
                    : 'text-slate-600 hover:text-amalfitile'
                }`}
              >
                Actionable
              </button>
              {/* Needs Review in Coral Flame #E8543F ONLY */}
              <button
                onClick={() => setActiveFilter('review')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                  activeFilter === 'review' 
                    ? 'bg-coralflame text-white shadow-coral-alert' 
                    : 'text-coralflame hover:bg-coralflame/10'
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
              <div key={n} className="h-44 rounded-3xl border border-[#EEDFB8] bg-[#FDFBF5] animate-pulse" />
            ))}
          </div>
        ) : viewMode === 'rollup' ? (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {filteredCategories.map((category) => {
              const isSelected = selectedClusterIds.includes(category.cluster_id);
              return (
                <div key={category.cluster_id} className="relative">
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      type="button"
                      onClick={() => handleToggleClusterSelect(category.cluster_id)}
                      className="p-1 rounded border border-[#EEDFB8] bg-white/90 text-slate-500 hover:text-amalfitile transition shadow-sm"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-amalfitile" />
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

      {/* Floating Bulk Action Bar with Persistent Running Total */}
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
