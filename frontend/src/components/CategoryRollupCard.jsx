import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Landmark, Code2, GraduationCap, Palette, BookOpen, 
  Users, Tag, Layers, ChevronDown, ChevronUp, ShieldAlert, 
  HardDrive, Mail, FolderSearch, CheckSquare, Square, AlertTriangle
} from 'lucide-react';
import FolderCard from './FolderCard';

const CATEGORY_ICONS = {
  jobs: Briefcase,
  banking: Landmark,
  devtools: Code2,
  learning: GraduationCap,
  creative: Palette,
  reading: BookOpen,
  networking: Users,
  promotions: Tag,
  general: Layers,
};

const CATEGORY_COLORS = {
  jobs: 'from-blue-600/20 to-indigo-600/10 border-blue-500/30 text-blue-400',
  banking: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-400',
  devtools: 'from-emerald-600/20 to-teal-600/10 border-emerald-500/30 text-emerald-400',
  learning: 'from-purple-600/20 to-indigo-600/10 border-purple-500/30 text-purple-400',
  creative: 'from-pink-600/20 to-rose-600/10 border-pink-500/30 text-pink-400',
  reading: 'from-cyan-600/20 to-blue-600/10 border-cyan-500/30 text-cyan-400',
  networking: 'from-violet-600/20 to-purple-600/10 border-violet-500/30 text-violet-400',
  promotions: 'from-orange-600/20 to-amber-600/10 border-orange-500/30 text-orange-400',
  general: 'from-slate-700/20 to-slate-800/10 border-slate-700/40 text-slate-400',
};

export default function CategoryRollupCard({ 
  rollup, 
  onSelectAction, 
  onInspect, 
  selectedClusterIds = [], 
  onToggleClusterSelect,
  onToggleParentSelect 
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const IconComponent = CATEGORY_ICONS[rollup.parent_id] || Layers;
  const colorTheme = CATEGORY_COLORS[rollup.parent_id] || CATEGORY_COLORS.general;

  const allChildClusterIds = rollup.clusters.map(c => c.cluster_id);
  const isFullySelected = allChildClusterIds.length > 0 && allChildClusterIds.every(id => selectedClusterIds.includes(id));
  const isPartiallySelected = allChildClusterIds.some(id => selectedClusterIds.includes(id)) && !isFullySelected;

  const handleParentCheckboxClick = (e) => {
    e.stopPropagation();
    if (rollup.is_sensitive) {
      // Sensitive categories warn on selection
      if (!isFullySelected) {
        const confirmSens = window.confirm(`"${rollup.parent_name}" contains sensitive financial or recruiter communications. Are you sure you want to include all ${rollup.total_emails} emails in bulk selection?`);
        if (!confirmSens) return;
      }
    }
    onToggleParentSelect(allChildClusterIds, !isFullySelected);
  };

  return (
    <div className={`bg-gradient-to-br ${colorTheme} border rounded-3xl p-5 sm:p-6 transition-all shadow-xl backdrop-blur-md`}>
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {/* Multi-select Checkbox */}
          <button
            type="button"
            onClick={handleParentCheckboxClick}
            className="mt-1 text-slate-400 hover:text-white transition"
            title={rollup.is_sensitive ? "Sensitive category - click to select" : "Select all in category"}
          >
            {isFullySelected ? (
              <CheckSquare className="w-5 h-5 text-indigo-400" />
            ) : isPartiallySelected ? (
              <div className="w-5 h-5 rounded border border-indigo-400 flex items-center justify-center bg-indigo-500/20">
                <div className="w-2.5 h-1 bg-indigo-400 rounded-sm" />
              </div>
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-white shrink-0">
            <IconComponent className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {rollup.parent_name}
              </h3>

              {rollup.is_sensitive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  <span>Needs Manual Review</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300">
              {rollup.clusters_count} brand {rollup.clusters_count === 1 ? 'cluster' : 'clusters'} • {rollup.clusters.slice(0, 4).map(c => c.category_name.split(':')[0]).join(', ')}
              {rollup.clusters.length > 4 && ` + ${rollup.clusters.length - 4} more`}
            </p>
          </div>
        </div>

        {/* Aggregated Metrics Pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-lg font-bold font-mono text-white block">
              {rollup.total_emails.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {rollup.unread_emails} unread • {rollup.storage_mb} MB
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition flex items-center gap-1 text-xs font-semibold"
          >
            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Brand Tags Preview */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/60">
        <span className="text-[11px] text-slate-400 font-medium mr-1">Brands:</span>
        {rollup.clusters.map((cluster) => {
          const brandName = cluster.category_name.split(':')[0].replace(/Job Openings.*/, 'Jobs').trim();
          const isChildSelected = selectedClusterIds.includes(cluster.cluster_id);
          return (
            <span 
              key={cluster.cluster_id}
              onClick={() => onToggleClusterSelect(cluster.cluster_id)}
              className={`text-xs px-2.5 py-1 rounded-xl border cursor-pointer transition flex items-center gap-1.5 ${
                isChildSelected
                  ? 'bg-indigo-600/30 border-indigo-400 text-indigo-200'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <span className="font-medium">{brandName}</span>
              <span className="text-[10px] text-slate-400 font-mono">({cluster.total_count})</span>
            </span>
          );
        })}
      </div>

      {/* Expandable Child Clusters View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-5 pt-5 border-t border-slate-800/80 space-y-4"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                Itemized Clusters in {rollup.parent_name} ({rollup.clusters.length})
              </span>
              <span>Click inspect on any card to view email snippets</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rollup.clusters.map((childCluster) => (
                <div key={childCluster.cluster_id} className="relative">
                  {/* Child Checkbox */}
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      type="button"
                      onClick={() => onToggleClusterSelect(childCluster.cluster_id)}
                      className="p-1 rounded bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white"
                    >
                      {selectedClusterIds.includes(childCluster.cluster_id) ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <FolderCard
                    category={childCluster}
                    onSelectAction={onSelectAction}
                    onInspect={onInspect}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
