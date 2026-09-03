import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Landmark, Terminal, GraduationCap, 
  Palette, BookOpen, Users, Tag, Layers, 
  ChevronDown, ChevronUp, CheckSquare, Square, ShieldAlert,
  Folder 
} from 'lucide-react';
import FolderCard from './FolderCard';

const CATEGORY_ICONS = {
  jobs: Briefcase,
  banking: Landmark,
  devtools: Terminal,
  learning: GraduationCap,
  creative: Palette,
  reading: BookOpen,
  networking: Users,
  promotions: Tag,
  general: Layers,
};

export default function CategoryRollupCard({ 
  rollup, 
  onSelectAction, 
  onInspect, 
  selectedClusterIds = [], 
  onToggleClusterSelect,
  onToggleParentSelect,
  theme = 'cream'
}) {
  const isCream = theme === 'cream';
  const [isExpanded, setIsExpanded] = useState(false);

  const IconComponent = CATEGORY_ICONS[rollup.parent_id] || Layers;

  const allChildClusterIds = rollup.clusters.map(c => c.cluster_id);
  const isFullySelected = allChildClusterIds.length > 0 && allChildClusterIds.every(id => selectedClusterIds.includes(id));
  const isPartiallySelected = allChildClusterIds.some(id => selectedClusterIds.includes(id)) && !isFullySelected;

  const handleParentCheckboxClick = (e) => {
    e.stopPropagation();
    if (rollup.is_sensitive) {
      if (!isFullySelected) {
        const confirmSens = window.confirm(`"${rollup.parent_name}" contains sensitive financial or recruiter communications. Are you sure you want to include all ${rollup.total_emails} emails in bulk selection?`);
        if (!confirmSens) return;
      }
    }
    onToggleParentSelect(allChildClusterIds, !isFullySelected);
  };

  return (
    <div className={`border rounded-3xl p-5 sm:p-6 transition-all shadow-lg ${
      isCream
        ? 'bg-white border-amber-900/15 shadow-amber-950/5'
        : 'bg-[#111D36]/90 border-amalfitile/30 shadow-2xl backdrop-blur-md'
    }`}>
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {/* Multi-select Checkbox */}
          <button
            type="button"
            onClick={handleParentCheckboxClick}
            className={`mt-1 transition ${isCream ? 'text-slate-400 hover:text-darkred' : 'text-slate-400 hover:text-white'}`}
            title={rollup.is_sensitive ? "Sensitive category - click to select" : "Select all in category"}
          >
            {isFullySelected ? (
              <CheckSquare className="w-5 h-5 text-darkred" />
            ) : isPartiallySelected ? (
              <div className="w-5 h-5 rounded border border-darkred flex items-center justify-center bg-darkred/15">
                <div className="w-2.5 h-1 bg-darkred rounded-sm" />
              </div>
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          <div className={`p-3 rounded-2xl border shrink-0 ${
            isCream 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-slate-950/60 border-slate-800 text-white'
          }`}>
            <IconComponent className="w-6 h-6 text-amalfitile" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`text-base sm:text-lg font-bold tracking-tight ${
                isCream ? 'text-slate-900' : 'text-white'
              }`}>
                {rollup.parent_name}
              </h3>

              {rollup.is_sensitive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-darkred/15 text-darkred border border-darkred/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-darkred" />
                  <span>Needs Manual Review</span>
                </span>
              )}
            </div>

            <p className={`text-xs ${isCream ? 'text-slate-600' : 'text-slate-300'}`}>
              {rollup.clusters_count} brand {rollup.clusters_count === 1 ? 'cluster' : 'clusters'} • {rollup.clusters.slice(0, 4).map(c => c.category_name.split(':')[0]).join(', ')}
              {rollup.clusters.length > 4 && ` + ${rollup.clusters.length - 4} more`}
            </p>
          </div>
        </div>

        {/* Aggregated Metrics Pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className={`text-lg font-bold font-mono block ${isCream ? 'text-slate-900' : 'text-white'}`}>
              {rollup.total_emails.toLocaleString()}
            </span>
            <span className={`text-[10px] block ${isCream ? 'text-slate-500' : 'text-slate-400'}`}>
              {rollup.unread_emails} unread • {rollup.storage_mb} MB
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2.5 rounded-xl border transition flex items-center gap-1 text-xs font-semibold ${
              isCream
                ? 'bg-amber-50 hover:bg-amber-100 text-slate-700 border-amber-200'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
            }`}
          >
            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Brand Tags Preview */}
      <div className={`flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t ${
        isCream ? 'border-amber-900/10' : 'border-slate-800/60'
      }`}>
        <span className={`text-[11px] font-medium mr-1 ${isCream ? 'text-slate-500' : 'text-slate-400'}`}>
          Brands:
        </span>
        {rollup.clusters.map((cluster) => {
          const brandName = cluster.category_name.split(':')[0].replace(/Job Openings.*/, 'Jobs').trim();
          const isChildSelected = selectedClusterIds.includes(cluster.cluster_id);
          return (
            <span 
              key={cluster.cluster_id}
              onClick={() => onToggleClusterSelect(cluster.cluster_id)}
              className={`text-xs px-2.5 py-1 rounded-xl border cursor-pointer transition flex items-center gap-1.5 ${
                isChildSelected
                  ? 'bg-darkred/15 border-darkred text-darkred font-semibold'
                  : isCream
                  ? 'bg-[#F9F5EC] border-amber-900/10 text-slate-700 hover:border-darkred/30'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <span className="font-medium">{brandName}</span>
              <span className={`text-[10px] font-mono ${isCream ? 'text-slate-400' : 'text-slate-500'}`}>
                ({cluster.total_count})
              </span>
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
            className={`mt-5 pt-5 border-t space-y-4 ${
              isCream ? 'border-amber-900/10' : 'border-slate-800/80'
            }`}
          >
            <div className={`flex items-center justify-between text-xs ${
              isCream ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <span className={`font-semibold ${isCream ? 'text-slate-900' : 'text-slate-200'}`}>
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
                      className={`p-1 rounded border ${
                        isCream 
                          ? 'bg-white/90 border-amber-300 text-slate-600 hover:text-darkred' 
                          : 'bg-slate-950/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {selectedClusterIds.includes(childCluster.cluster_id) ? (
                        <CheckSquare className="w-4 h-4 text-darkred" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <FolderCard
                    category={childCluster}
                    onSelectAction={onSelectAction}
                    onInspect={onInspect}
                    theme={theme}
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
