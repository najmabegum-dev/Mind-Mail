import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, Landmark, Terminal, GraduationCap, 
  Palette, BookOpen, Users, Tag, Layers, 
  ChevronDown, ChevronUp, CheckSquare, Square, ShieldAlert 
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
  onToggleParentSelect 
}) {
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
    <div className="bg-[#FDFBF5] border border-[#EEDFB8] rounded-3xl p-5 sm:p-6 transition-all shadow-sm hover:shadow-md">
      {/* Top Header Row (Structured with Amalfi Tile #2E5AA7) */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {/* Multi-select Checkbox */}
          <button
            type="button"
            onClick={handleParentCheckboxClick}
            className="mt-1 text-slate-400 hover:text-amalfitile transition"
            title={rollup.is_sensitive ? "Sensitive category - click to select" : "Select all in category"}
          >
            {isFullySelected ? (
              <CheckSquare className="w-5 h-5 text-amalfitile" />
            ) : isPartiallySelected ? (
              <div className="w-5 h-5 rounded border border-amalfitile flex items-center justify-center bg-amalfitile/15">
                <div className="w-2.5 h-1 bg-amalfitile rounded-sm" />
              </div>
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>

          {/* Category Icon */}
          <div className="p-3 rounded-2xl bg-amalfitile text-white shadow-amalfi-struct shrink-0">
            <IconComponent className="w-6 h-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-extrabold text-amalfitile-dark tracking-tight">
                {rollup.parent_name}
              </h3>

              {/* Coral Flame ONLY for Needs Review */}
              {rollup.is_sensitive && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-coralflame/15 text-coralflame border border-coralflame/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-coralflame" />
                  <span>Needs Manual Review</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {rollup.clusters_count} brand {rollup.clusters_count === 1 ? 'cluster' : 'clusters'} • {rollup.clusters.slice(0, 4).map(c => c.category_name.split(':')[0]).join(', ')}
              {rollup.clusters.length > 4 && ` + ${rollup.clusters.length - 4} more`}
            </p>
          </div>
        </div>

        {/* Aggregated Metrics Pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-lg font-bold font-mono text-amalfitile-dark block">
              {rollup.total_emails.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              <span className="text-citrus font-bold">{rollup.unread_emails}</span> unread • {rollup.storage_mb} MB
            </span>
          </div>

          {/* Expand / Hide Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-[#FBF6E9] text-amalfitile border border-[#EEDFB8] shadow-sm transition flex items-center gap-1.5 text-xs font-bold"
          >
            <span>{isExpanded ? 'Hide' : 'Expand'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Brand Tags Preview (Sea Breeze #86C5FF for secondary/tags) */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-[#EEDFB8]/80">
        <span className="text-[11px] font-bold text-slate-500 mr-1">Brands:</span>
        {rollup.clusters.map((cluster) => {
          const brandName = cluster.category_name.split(':')[0].replace(/Job Openings.*/, 'Jobs').trim();
          const isChildSelected = selectedClusterIds.includes(cluster.cluster_id);
          return (
            <span 
              key={cluster.cluster_id}
              onClick={() => onToggleClusterSelect(cluster.cluster_id)}
              className={`text-xs px-2.5 py-1 rounded-xl border cursor-pointer transition flex items-center gap-1.5 font-medium ${
                isChildSelected
                  ? 'bg-amalfitile text-white border-amalfitile font-bold shadow-sm'
                  : 'bg-seabreeze/15 border-seabreeze/40 text-seabreeze-dark hover:bg-seabreeze/25'
              }`}
            >
              <span>{brandName}</span>
              <span className={`text-[10px] font-mono ${isChildSelected ? 'text-seabreeze' : 'text-slate-500'}`}>
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
            className="mt-5 pt-5 border-t border-[#EEDFB8] space-y-4"
          >
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold text-amalfitile-dark">
                Itemized Clusters in {rollup.parent_name} ({rollup.clusters.length})
              </span>
              <span className="font-medium text-slate-500">Click inspect on any card to view email snippets</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {rollup.clusters.map((childCluster) => (
                <div key={childCluster.cluster_id} className="relative">
                  {/* Child Checkbox */}
                  <div className="absolute top-4 left-4 z-10">
                    <button
                      type="button"
                      onClick={() => onToggleClusterSelect(childCluster.cluster_id)}
                      className="p-1 rounded border bg-white/90 border-[#EEDFB8] text-slate-500 hover:text-amalfitile transition"
                    >
                      {selectedClusterIds.includes(childCluster.cluster_id) ? (
                        <CheckSquare className="w-4 h-4 text-amalfitile" />
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
