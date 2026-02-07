import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReportStore } from '../stores/reportStore';

export const HistoryPage: React.FC = () => {
  const { variant } = useParams<{ variant: string }>();
  const navigate = useNavigate();
  const { history, removeFromHistory, clearHistory, setCurrentReport } =
    useReportStore();

  const base = variant ? `/${variant}` : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-100">📜 Report History</h1>
        {history.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Clear all report history?')) {
                clearHistory();
              }
            }}
            className="px-3 py-1.5 text-sm rounded-md bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <span className="text-4xl mb-4 block">📜</span>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            No Reports Yet
          </h2>
          <p className="text-gray-500 text-sm">
            Generate your first threat intelligence report to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((report) => (
            <div
              key={report.id}
              className="glass-panel p-4 flex items-center justify-between group"
            >
              <button
                onClick={() => {
                  setCurrentReport(report);
                  navigate(`${base}/report/${report.id}`);
                }}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-200 group-hover:text-cyber-400 transition-colors">
                    {report.topic}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                    {report.tier}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>
                    {new Date(report.createdAt).toLocaleString()}
                  </span>
                  <span>·</span>
                  <span>{report.sections.length} sections</span>
                  <span>·</span>
                  <span>{report.iocs.length} IOCs</span>
                  <span>·</span>
                  <span>{report.attackMapping.length} techniques</span>
                </div>
              </button>
              <button
                onClick={() => removeFromHistory(report.id)}
                className="ml-4 p-2 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove from history"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
