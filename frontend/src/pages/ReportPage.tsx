import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReportStore } from '../stores/reportStore';
import { apiClient } from '../api/client';
import type { Report, TLPLevel, ReportSection } from '../types';

const TLP_STYLES: Record<TLPLevel, string> = {
  'TLP:CLEAR': 'tlp-clear',
  'TLP:GREEN': 'tlp-green',
  'TLP:AMBER': 'tlp-amber',
  'TLP:AMBER+STRICT': 'tlp-amber-strict',
  'TLP:RED': 'tlp-red',
};

const TLP_BANNERS: Record<TLPLevel, string> = {
  'TLP:CLEAR': '🟢 TLP:CLEAR — Disclosure is not limited.',
  'TLP:GREEN': '🟢 TLP:GREEN — Limited disclosure, community only.',
  'TLP:AMBER': '🟡 TLP:AMBER — Limited disclosure, restricted to participants\' organizations.',
  'TLP:AMBER+STRICT': '🟡 TLP:AMBER+STRICT — Limited disclosure, restricted to participants only.',
  'TLP:RED': '🔴 TLP:RED — Not for disclosure. Restricted to participants only.',
};

/**
 * Inject clickable footnote superscripts into section content.
 * Citations come in as "[N]" format — we render them as clickable
 * superscript links that scroll to the endnotes section.
 */
function renderContentWithFootnotes(content: string, citations: string[]): React.ReactNode {
  if (!citations.length) {
    return <span className="whitespace-pre-wrap">{content}</span>;
  }

  // Build a regex matching [N] patterns
  const pattern = /\[(\d+)\]/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    const noteNum = match[1];
    parts.push(
      <a
        key={`fn-${match.index}`}
        href={`#endnote-${noteNum}`}
        className="text-cyber-400 hover:text-cyber-300 text-[10px] align-super no-underline hover:underline"
        title={`See endnote ${noteNum}`}
      >
        [{noteNum}]
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <span className="whitespace-pre-wrap">{parts}</span>;
}

export const ReportPage: React.FC = () => {
  const { reportId, variant } = useParams<{ reportId: string; variant: string }>();
  const navigate = useNavigate();
  const currentReport = useReportStore((s) => s.currentReport);
  const getReportById = useReportStore((s) => s.getReportById);
  const [activeSectionId, setActiveSectionId] = useState<string>('bluf');
  const [exporting, setExporting] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const report =
    reportId && reportId !== 'latest'
      ? getReportById(reportId) ?? currentReport
      : currentReport;

  // ── Scrollspy ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!report) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    // Observe all section elements
    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [report]);

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id] || document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // ── Export handlers ──────────────────────────────────────────────────
  const handleExportMarkdown = useCallback(async () => {
    if (!report) return;
    setExporting(true);
    try {
      const md = await apiClient.exportMarkdown(report);
      // Handle the response — it might be a string or wrapped
      const text = typeof md === 'string' ? md : JSON.stringify(md);
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.topic.replace(/[^a-zA-Z0-9]/g, '_')}_report.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Markdown export failed:', err);
    } finally {
      setExporting(false);
    }
  }, [report]);

  const handleExportPdf = useCallback(() => {
    alert('PDF export is not yet implemented. Use Markdown export and convert with pandoc.');
  }, []);

  // ── Build TOC entries ──────────────────────────────────────────────
  const tocEntries: { id: string; title: string }[] = [];
  if (report) {
    tocEntries.push({ id: 'bluf', title: 'BLUF' });
    if (report.threatActor) {
      tocEntries.push({ id: 'threat-actor-profile', title: 'Threat Actor' });
    }
    report.sections.forEach((s) => {
      tocEntries.push({ id: s.id, title: s.title });
    });
    if (report.iocs.length > 0) {
      tocEntries.push({ id: 'iocs-table', title: 'IOCs' });
    }
    if (report.attackMapping.length > 0) {
      tocEntries.push({ id: 'attack-mapping', title: 'ATT&CK Mapping' });
    }
    if (report.confidenceAssessments.length > 0) {
      tocEntries.push({ id: 'confidence', title: 'Confidence' });
    }
    tocEntries.push({ id: 'endnotes', title: 'Endnotes' });
    tocEntries.push({ id: 'bibliography', title: 'Bibliography' });
  }

  // ── No report state ─────────────────────────────────────────────────
  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-12">
          <span className="text-4xl mb-4 block">📄</span>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            No Report Selected
          </h2>
          <p className="text-gray-500">
            Generate a report from the Home page to view it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-7xl mx-auto px-4 py-8 gap-6">
      {/* ── TOC Sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:block w-56 flex-shrink-0">
        <nav className="sticky top-24 space-y-1">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Contents
          </h3>
          {tocEntries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => scrollToSection(entry.id)}
              className={`block w-full text-left text-sm px-3 py-1.5 rounded-md transition-all ${
                activeSectionId === entry.id
                  ? 'text-cyber-400 bg-cyber-500/10 border-l-2 border-cyber-500'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              {entry.title}
            </button>
          ))}

          {/* Export Buttons */}
          <div className="pt-4 mt-4 border-t border-gray-800 space-y-2">
            <button
              onClick={handleExportMarkdown}
              disabled={exporting}
              className="w-full px-3 py-2 text-sm rounded-md bg-cyber-500/10 text-cyber-400 hover:bg-cyber-500/20 transition-all disabled:opacity-50"
            >
              {exporting ? 'Exporting...' : '📝 Export Markdown'}
            </button>
            <button
              onClick={handleExportPdf}
              className="w-full px-3 py-2 text-sm rounded-md bg-gray-800/50 text-gray-400 hover:bg-gray-800 transition-all"
            >
              📄 Export PDF
            </button>
          </div>
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 max-w-4xl">
        {/* TLP Banner */}
        <div className={`mb-6 p-3 rounded-lg border text-sm font-medium text-center ${
          report.tlp === 'TLP:RED' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
          report.tlp.includes('AMBER') ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
          'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {TLP_BANNERS[report.tlp]}
        </div>

        {/* Header */}
        <div className="glass-panel p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">
                {report.topic}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Generated {new Date(report.createdAt).toLocaleString()} · {report.tier} Tier
                · <code className="text-xs text-gray-600">{report.id}</code>
              </p>
            </div>
            <span className={`threat-badge ${TLP_STYLES[report.tlp]}`}>
              {report.tlp}
            </span>
          </div>

          {/* BLUF */}
          <div
            id="bluf"
            ref={(el) => { sectionRefs.current['bluf'] = el; }}
            className="bg-cyber-500/5 border border-cyber-500/20 rounded-lg p-4"
          >
            <h3 className="text-xs font-semibold text-cyber-400 uppercase tracking-wider mb-2">
              BLUF — Bottom Line Up Front
            </h3>
            <p className="text-gray-200 leading-relaxed">{report.bluf}</p>
          </div>
        </div>

        {/* Threat Actor Profile */}
        {report.threatActor && (
          <div
            id="threat-actor-profile"
            ref={(el) => { sectionRefs.current['threat-actor-profile'] = el; }}
            className="glass-panel p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-200 mb-4">
              Threat Actor Profile
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>{' '}
                <span className="text-gray-200 font-medium">
                  {report.threatActor.name}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Attribution:</span>{' '}
                <span className="text-gray-200">
                  {report.threatActor.attribution}
                </span>
              </div>
              {report.threatActor.aliases.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">Aliases:</span>{' '}
                  <span className="text-gray-300">
                    {report.threatActor.aliases.join(', ')}
                  </span>
                </div>
              )}
              {report.threatActor.firstSeen && (
                <div>
                  <span className="text-gray-500">First Seen:</span>{' '}
                  <span className="text-gray-300">
                    {report.threatActor.firstSeen}
                  </span>
                </div>
              )}
              {report.threatActor.lastActive && (
                <div>
                  <span className="text-gray-500">Last Active:</span>{' '}
                  <span className="text-gray-300">
                    {report.threatActor.lastActive}
                  </span>
                </div>
              )}
              {report.threatActor.tooling.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-500">Tooling:</span>{' '}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {report.threatActor.tooling.map((tool) => (
                      <span
                        key={tool}
                        className="px-2 py-0.5 text-xs rounded bg-gray-800 text-gray-300 border border-gray-700"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Report Sections */}
        {report.sections.map((section) => (
          <div
            key={section.id}
            id={section.id}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className="glass-panel p-6 mb-4"
          >
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              {section.title}
            </h2>
            <div className="text-gray-300 leading-relaxed">
              {renderContentWithFootnotes(section.content, section.citations)}
            </div>
          </div>
        ))}

        {/* IOCs */}
        {report.iocs.length > 0 && (
          <div
            id="iocs-table"
            ref={(el) => { sectionRefs.current['iocs-table'] = el; }}
            className="glass-panel p-6 mb-4"
          >
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              Indicators of Compromise
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-800">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Value</th>
                    <th className="pb-2">Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {report.iocs.map((ioc, i) => (
                    <tr key={`${ioc.type}-${ioc.value}-${i}`}>
                      <td className="py-2 pr-4">
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300 uppercase font-mono">
                          {ioc.type}
                        </span>
                      </td>
                      <td className="py-2 pr-4 font-mono text-cyber-400 text-xs break-all">
                        {ioc.value}
                      </td>
                      <td className="py-2 text-gray-400 text-xs">
                        {ioc.context ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ATT&CK Mapping */}
        {report.attackMapping.length > 0 && (
          <div
            id="attack-mapping"
            ref={(el) => { sectionRefs.current['attack-mapping'] = el; }}
            className="glass-panel p-6 mb-4"
          >
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              MITRE ATT&CK Mapping
            </h2>
            <div className="space-y-3">
              {report.attackMapping.map((tech) => (
                <div
                  key={tech.techniqueId}
                  className="p-3 rounded-md bg-gray-800/30 border border-gray-800"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-cyber-400">
                      {tech.techniqueId}
                    </span>
                    <span className="font-medium text-gray-200 text-sm">
                      {tech.name}
                    </span>
                    <span className="text-xs text-gray-500">({tech.tactic})</span>
                  </div>
                  <p className="text-xs text-gray-400">{tech.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Assessments */}
        {report.confidenceAssessments.length > 0 && (
          <div
            id="confidence"
            ref={(el) => { sectionRefs.current['confidence'] = el; }}
            className="glass-panel p-6 mb-4"
          >
            <h2 className="text-lg font-semibold text-gray-200 mb-3">
              Confidence Assessments
            </h2>
            <div className="space-y-2">
              {report.confidenceAssessments.map((assessment, i) => {
                const confidenceColors = {
                  Low: 'text-red-400 bg-red-500/10',
                  Moderate: 'text-amber-400 bg-amber-500/10',
                  High: 'text-green-400 bg-green-500/10',
                };
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-gray-800/20">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                        confidenceColors[assessment.confidence]
                      }`}
                    >
                      {assessment.confidence}
                    </span>
                    <div>
                      <p className="text-sm text-gray-200">
                        {assessment.finding}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {assessment.rationale}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Endnotes */}
        <div
          id="endnotes"
          ref={(el) => { sectionRefs.current['endnotes'] = el; }}
          className="glass-panel p-6 mb-4"
        >
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Endnotes</h2>
          {report.sources.length > 0 ? (
            <ol className="space-y-2 list-decimal list-inside">
              {report.sources.map((source, i) => (
                <li
                  key={i}
                  id={`endnote-${i + 1}`}
                  className="text-sm text-gray-300"
                >
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-400 hover:underline"
                  >
                    {source.title}
                  </a>
                  <span className="text-gray-500 text-xs ml-1">
                    , accessed {new Date(source.accessedAt).toLocaleDateString()},{' '}
                  </span>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 text-xs hover:text-gray-400 break-all"
                  >
                    {source.url}
                  </a>
                  .
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-gray-500 text-sm">No sources to cite.</p>
          )}
        </div>

        {/* Bibliography */}
        <div
          id="bibliography"
          ref={(el) => { sectionRefs.current['bibliography'] = el; }}
          className="glass-panel p-6 mb-4"
        >
          <h2 className="text-lg font-semibold text-gray-200 mb-3">
            Bibliography
          </h2>
          {report.sources.length > 0 ? (
            <div className="space-y-3">
              {[...report.sources]
                .sort((a, b) => a.title.localeCompare(b.title))
                .map((source, i) => (
                  <div key={i} className="text-sm text-gray-300 pl-8 -indent-8">
                    &ldquo;{source.title}.&rdquo;{' '}
                    <span className="text-gray-500">
                      Accessed{' '}
                      {new Date(source.accessedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      .
                    </span>{' '}
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyber-400 hover:underline break-all"
                    >
                      {source.url}
                    </a>
                    .
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No sources.</p>
          )}
        </div>

        {/* Mobile Export Buttons */}
        <div className="lg:hidden flex gap-3 mt-6">
          <button
            onClick={handleExportMarkdown}
            disabled={exporting}
            className="flex-1 px-4 py-3 rounded-lg bg-cyber-500/10 text-cyber-400 font-medium hover:bg-cyber-500/20 transition-all disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : '📝 Export Markdown'}
          </button>
          <button
            onClick={handleExportPdf}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800/50 text-gray-400 font-medium hover:bg-gray-800 transition-all"
          >
            📄 Export PDF
          </button>
        </div>
      </div>
    </div>
  );
};
