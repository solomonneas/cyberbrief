import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { useReportStore } from '../stores/reportStore';
import type { AttackTechnique } from '../types';

export const AttackPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AttackTechnique[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentReport = useReportStore((s) => s.currentReport);
  const reportTechniques = currentReport?.attackMapping ?? [];

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.lookupTechnique(query.trim());
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const displayTechniques = results.length > 0 ? results : reportTechniques;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-6">
        🎯 ATT&CK Explorer
      </h1>

      {/* Search */}
      <div className="glass-panel p-4 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search technique ID or name... (e.g., T1059)"
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-500/50"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-cyber-500 hover:bg-cyber-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-400 mt-2">{error}</p>
        )}
      </div>

      {/* Techniques */}
      {displayTechniques.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {results.length > 0
              ? `Search Results (${results.length})`
              : `Techniques from Current Report (${reportTechniques.length})`}
          </h2>
          {displayTechniques.map((tech) => (
            <div
              key={tech.techniqueId}
              className="glass-panel p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-sm text-cyber-400 bg-cyber-500/10 px-2 py-0.5 rounded">
                  {tech.techniqueId}
                </span>
                <h3 className="font-semibold text-gray-100">{tech.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                  {tech.tactic}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-3">{tech.description}</p>

              {tech.evidence.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase">
                    Evidence
                  </p>
                  {tech.evidence.map((ev, i) => (
                    <div
                      key={i}
                      className="pl-3 border-l-2 border-cyber-500/30 text-xs"
                    >
                      <p className="text-gray-300 italic">"{ev.quote}"</p>
                      <p className="text-gray-500 mt-0.5">— {ev.source}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center">
          <span className="text-4xl mb-4 block">🎯</span>
          <h2 className="text-lg font-semibold text-gray-300 mb-2">
            No Techniques Loaded
          </h2>
          <p className="text-gray-500 text-sm">
            Search for a technique ID or generate a report to see ATT&CK mappings.
          </p>
        </div>
      )}
    </div>
  );
};
