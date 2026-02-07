import React from 'react';
import { useParams } from 'react-router-dom';
import { useReportStore } from '../stores/reportStore';
import type { TLPLevel } from '../types';

const TLP_STYLES: Record<TLPLevel, string> = {
  'TLP:CLEAR': 'tlp-clear',
  'TLP:GREEN': 'tlp-green',
  'TLP:AMBER': 'tlp-amber',
  'TLP:AMBER+STRICT': 'tlp-amber-strict',
  'TLP:RED': 'tlp-red',
};

export const ReportPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const currentReport = useReportStore((s) => s.currentReport);
  const getReportById = useReportStore((s) => s.getReportById);

  const report =
    reportId && reportId !== 'latest'
      ? getReportById(reportId) ?? currentReport
      : currentReport;

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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              {report.topic}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Generated {new Date(report.createdAt).toLocaleString()} · {report.tier} Tier
            </p>
          </div>
          <span className={`threat-badge ${TLP_STYLES[report.tlp]}`}>
            {report.tlp}
          </span>
        </div>

        {/* BLUF */}
        <div className="bg-cyber-500/5 border border-cyber-500/20 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-cyber-400 uppercase tracking-wider mb-2">
            BLUF — Bottom Line Up Front
          </h3>
          <p className="text-gray-200 leading-relaxed">{report.bluf}</p>
        </div>
      </div>

      {/* Threat Actor Profile */}
      {report.threatActor && (
        <div className="glass-panel p-6 mb-6">
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
        <div key={section.id} className="glass-panel p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">
            {section.title}
          </h2>
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {section.content}
          </div>
          {section.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <p className="text-xs text-gray-500">
                Sources: {section.citations.join(', ')}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* IOCs */}
      {report.iocs.length > 0 && (
        <div className="glass-panel p-6 mb-4">
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
                    <td className="py-2 pr-4 font-mono text-cyber-400 text-xs">
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
        <div className="glass-panel p-6 mb-4">
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
        <div className="glass-panel p-6 mb-4">
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
                    className={`px-2 py-0.5 rounded text-xs font-medium ${confidenceColors[assessment.confidence]}`}
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

      {/* Sources */}
      {report.sources.length > 0 && (
        <div className="glass-panel p-6 mb-4">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Sources</h2>
          <ol className="space-y-2 list-decimal list-inside">
            {report.sources.map((source, i) => (
              <li key={i} className="text-sm">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-400 hover:underline"
                >
                  {source.title}
                </a>
                <span className="text-gray-500 text-xs ml-2">
                  Accessed {new Date(source.accessedAt).toLocaleDateString()}
                </span>
                {source.snippet && (
                  <p className="text-xs text-gray-500 mt-1 ml-4 italic">
                    "{source.snippet}"
                  </p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
