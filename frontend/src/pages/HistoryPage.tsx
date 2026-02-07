import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useReportStore } from '../stores/reportStore';
import type { ResearchTier, Report } from '../types';

const TIER_BADGE: Record<ResearchTier, string> = {
  FREE: 'bg-green-500/15 text-green-400 border-green-500/25',
  STANDARD: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  DEEP: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
};

const TIER_FILTERS: { value: ResearchTier | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Tiers' },
  { value: 'FREE', label: 'Free' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DEEP', label: 'Deep' },
];

export const HistoryPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { history, removeFromHistory, clearHistory, setCurrentReport } = useReportStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<ResearchTier | 'ALL'>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const basePath = location.pathname.match(/^\/\d+/)?.[0] ?? '';

  // Filtered reports
  const filteredReports = useMemo(() => {
    let reports = history;
    if (tierFilter !== 'ALL') {
      reports = reports.filter((r) => r.tier === tierFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.topic.toLowerCase().includes(q) ||
          r.threatActor?.name?.toLowerCase().includes(q)
      );
    }
    return reports;
  }, [history, tierFilter, searchQuery]);

  // Selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReports.map((r) => r.id)));
    }
  }, [selectedIds.size, filteredReports]);

  // Export individual report as markdown (client-side)
  const exportReportMarkdown = useCallback((report: Report) => {
    const lines: string[] = [
      `# ${report.topic}`,
      '',
      `**Tier:** ${report.tier} | **TLP:** ${report.tlp} | **Date:** ${new Date(report.createdAt).toLocaleString()}`,
      '',
      '## BLUF',
      report.bluf,
      '',
    ];

    if (report.threatActor) {
      lines.push('## Threat Actor Profile', '');
      lines.push(`- **Name:** ${report.threatActor.name}`);
      if (report.threatActor.aliases.length) lines.push(`- **Aliases:** ${report.threatActor.aliases.join(', ')}`);
      lines.push(`- **Attribution:** ${report.threatActor.attribution}`);
      lines.push('');
    }

    report.sections.forEach((s) => {
      lines.push(`## ${s.title}`, '', s.content, '');
    });

    if (report.iocs.length > 0) {
      lines.push('## Indicators of Compromise', '');
      lines.push('| Type | Value | Context |');
      lines.push('|------|-------|---------|');
      report.iocs.forEach((ioc) => {
        lines.push(`| ${ioc.type} | \`${ioc.value}\` | ${ioc.context ?? '—'} |`);
      });
      lines.push('');
    }

    if (report.attackMapping.length > 0) {
      lines.push('## MITRE ATT&CK Mapping', '');
      report.attackMapping.forEach((t) => {
        lines.push(`- **${t.techniqueId}** ${t.name} (${t.tactic})`);
      });
      lines.push('');
    }

    if (report.sources.length > 0) {
      lines.push('## Sources', '');
      report.sources.forEach((s, i) => {
        lines.push(`${i + 1}. ${s.title} — ${s.url}`);
      });
    }

    return lines.join('\n');
  }, []);

  const downloadReport = useCallback((report: Report) => {
    const md = exportReportMarkdown(report);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.topic.replace(/[^a-zA-Z0-9]/g, '_')}_report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportReportMarkdown]);

  const downloadSelected = useCallback(() => {
    const selectedReports = filteredReports.filter((r) => selectedIds.has(r.id));
    selectedReports.forEach((report) => {
      downloadReport(report);
    });
  }, [filteredReports, selectedIds, downloadReport]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">📜 Report History</h1>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <button
              onClick={downloadSelected}
              className="px-3 py-1.5 text-sm rounded-md bg-cyber-500/10 text-cyber-400 border border-cyber-500/20 hover:bg-cyber-500/20 transition-colors"
            >
              ⬇ Download {selectedIds.size} selected
            </button>
          )}
          {history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all report history? This cannot be undone.')) {
                  clearHistory();
                  setSelectedIds(new Set());
                }
              }}
              className="px-3 py-1.5 text-sm rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {history.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by topic or threat actor..."
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-500/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">✕</button>
            )}
          </div>
          {/* Tier Filter */}
          <div className="flex gap-1.5">
            {TIER_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setTierFilter(f.value)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                  tierFilter === f.value
                    ? 'border-cyber-500/40 bg-cyber-500/10 text-cyber-400'
                    : 'border-gray-700 bg-gray-800/50 text-gray-500 hover:text-gray-300'
                }`}
              >{f.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Report List */}
      {history.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <span className="text-4xl mb-4 block">📜</span>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">No Reports Yet</h2>
          <p className="text-gray-500 text-sm">Generate your first threat intelligence report to see it here.</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <span className="text-3xl mb-3 block">🔍</span>
          <p className="text-gray-400 text-sm">No reports match your search criteria.</p>
        </div>
      ) : (
        <>
          {/* Select All */}
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredReports.length && filteredReports.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-600 bg-gray-800 text-cyber-500 focus:ring-cyber-500/50"
              />
              Select all ({filteredReports.length})
            </label>
            <span className="text-xs text-gray-600">
              {filteredReports.length} report{filteredReports.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2">
            {filteredReports.map((report) => (
              <div key={report.id} className="glass-panel p-4 flex items-center gap-3 group hover:border-gray-700 transition-all">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(report.id)}
                  onChange={() => toggleSelect(report.id)}
                  className="rounded border-gray-600 bg-gray-800 text-cyber-500 focus:ring-cyber-500/50 flex-shrink-0"
                />

                {/* Main content (clickable) */}
                <button
                  onClick={() => { setCurrentReport(report); navigate(`${basePath}/report/${report.id}`); }}
                  className="flex-1 text-left min-w-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-200 group-hover:text-cyber-400 transition-colors truncate">
                      {report.topic}
                    </h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${TIER_BADGE[report.tier]}`}>
                      {report.tier}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{new Date(report.createdAt).toLocaleString()}</span>
                    {report.threatActor?.name && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-gray-400">{report.threatActor.name}</span>
                      </>
                    )}
                    <span className="text-gray-700">·</span>
                    <span>{report.iocs?.length ?? 0} IOCs</span>
                    <span className="text-gray-700">·</span>
                    <span>{report.attackMapping?.length ?? 0} techniques</span>
                    <span className="text-gray-700">·</span>
                    <span>{report.sections?.length ?? 0} sections</span>
                  </div>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => downloadReport(report)}
                    className="p-2 text-gray-500 hover:text-cyber-400 transition-colors"
                    title="Download markdown"
                  >⬇</button>
                  {deleteConfirm === report.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { removeFromHistory(report.id); setDeleteConfirm(null); setSelectedIds((prev) => { const n = new Set(prev); n.delete(report.id); return n; }); }}
                        className="px-2 py-1 text-xs text-red-400 bg-red-500/10 rounded hover:bg-red-500/20"
                      >Confirm</button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-300"
                      >Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(report.id)}
                      className="p-2 text-gray-600 hover:text-red-400 transition-colors"
                      title="Delete report"
                    >✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
