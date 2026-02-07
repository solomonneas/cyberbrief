import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useResearchStore } from '../stores/researchStore';
import { useReportStore } from '../stores/reportStore';
import { apiClient } from '../api/client';
import type { ResearchTier } from '../types';

const SUGGESTED_TOPICS = [
  'APT28 Fancy Bear',
  'Log4Shell',
  'MOVEit Campaign',
  'Volt Typhoon',
  'SolarWinds',
  'Ransomware Healthcare 2025',
];

const TIER_INFO: {
  tier: ResearchTier;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiresKey?: string;
}[] = [
  {
    tier: 'FREE',
    name: 'Free Tier',
    description: 'Brave Search + Gemini Flash synthesis. 10 queries/day.',
    icon: '🔓',
    color: 'border-green-500/30 bg-green-500/5',
  },
  {
    tier: 'STANDARD',
    name: 'Standard',
    description: 'Perplexity Sonar for enhanced research depth.',
    icon: '🔑',
    color: 'border-cyber-500/30 bg-cyber-500/5',
    requiresKey: 'perplexity',
  },
  {
    tier: 'DEEP',
    name: 'Deep Research',
    description: 'Perplexity Deep Research for comprehensive analysis.',
    icon: '🔬',
    color: 'border-purple-500/30 bg-purple-500/5',
    requiresKey: 'perplexity',
  },
];

export const HomePage: React.FC = () => {
  const { variant } = useParams<{ variant: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [selectedTier, setSelectedTier] = useState<ResearchTier>('FREE');

  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const hasApiKey = useSettingsStore((s) => s.hasApiKey);
  const { phase, progress, progressMessage, error, rateLimit } =
    useResearchStore();
  const {
    setPhase,
    setProgress,
    setError,
    setCurrentBundle,
    decrementRateLimit,
    reset: resetResearch,
  } = useResearchStore();
  const { setCurrentReport, addToHistory, history } = useReportStore();

  const isLoading = phase !== 'idle' && phase !== 'complete' && phase !== 'error';

  const canSubmit =
    topic.trim().length > 0 &&
    !isLoading &&
    (selectedTier === 'FREE'
      ? rateLimit.remaining > 0
      : hasApiKey(selectedTier === 'STANDARD' || selectedTier === 'DEEP' ? 'perplexity' : 'brave'));

  const handleResearch = useCallback(async () => {
    if (!canSubmit) return;

    resetResearch();
    setPhase('searching', 'Searching for threat intelligence...');

    try {
      // Phase 1: Research
      setProgress(10, 'Initiating search queries...');
      const bundle = await apiClient.research({
        topic: topic.trim(),
        tier: selectedTier,
        apiKeys,
      });

      setCurrentBundle(bundle);
      setProgress(50, 'Search complete. Synthesizing intelligence...');
      setPhase('generating', 'Generating intelligence report...');

      // Phase 2: Report generation
      setProgress(60, 'Structuring report sections...');
      const report = await apiClient.generateReport({ bundle });

      setProgress(90, 'Finalizing report...');
      setCurrentReport(report);
      addToHistory(report);

      if (selectedTier === 'FREE') {
        decrementRateLimit();
      }

      setPhase('complete', 'Report ready!');
      setProgress(100, 'Report generated successfully.');

      // Navigate to report view
      const base = variant ? `/${variant}` : '';
      navigate(`${base}/report/${report.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    }
  }, [
    canSubmit,
    topic,
    selectedTier,
    apiKeys,
    variant,
    navigate,
    resetResearch,
    setPhase,
    setProgress,
    setCurrentBundle,
    setCurrentReport,
    addToHistory,
    decrementRateLimit,
    setError,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault();
      handleResearch();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          <span className="text-cyber-500">Cyber</span>
          <span className="text-gray-100">BRIEF</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Automated cyber threat intelligence research & reporting
        </p>
      </div>

      {/* Search Input */}
      <div className="glass-panel p-6 mb-6">
        <div className="relative">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter a threat topic... (e.g., APT44 Sandworm)"
            disabled={isLoading}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-4 text-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyber-500/50 focus:border-cyber-500 disabled:opacity-50 transition-all"
          />
          {topic.length > 0 && !isLoading && (
            <button
              onClick={() => setTopic('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Suggested Topics */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-xs text-gray-500 mr-1 self-center">
            Suggested:
          </span>
          {SUGGESTED_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              disabled={isLoading}
              className="px-3 py-1 text-sm rounded-full bg-gray-800/80 text-gray-300 border border-gray-700 hover:border-cyber-500/50 hover:text-cyber-400 transition-all disabled:opacity-50"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tier Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {TIER_INFO.map((info) => {
          const isLocked =
            info.requiresKey && !hasApiKey(info.requiresKey as keyof typeof apiKeys);
          const isSelected = selectedTier === info.tier;

          return (
            <button
              key={info.tier}
              onClick={() => !isLocked && setSelectedTier(info.tier)}
              disabled={isLoading || isLocked}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? `${info.color} ring-2 ring-offset-2 ring-offset-gray-950 ring-cyber-500/30`
                  : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{info.icon}</span>
                <h3 className="font-semibold text-gray-100">{info.name}</h3>
              </div>
              <p className="text-xs text-gray-400">{info.description}</p>
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-950/60 rounded-lg">
                  <span className="text-xs text-gray-400">
                    Add API key in Settings
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Generate Button + Progress */}
      <div className="text-center mb-8">
        <button
          onClick={handleResearch}
          disabled={!canSubmit}
          className="px-8 py-3 rounded-lg bg-cyber-500 hover:bg-cyber-600 text-white font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cyber-glow"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              {progressMessage || 'Researching...'}
            </span>
          ) : (
            'Generate Report'
          )}
        </button>

        {/* Progress Bar */}
        {isLoading && (
          <div className="mt-4 max-w-md mx-auto">
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-cyber-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{progressMessage}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Rate Limit */}
        {selectedTier === 'FREE' && (
          <p className="text-xs text-gray-500 mt-3">
            Free tier:{' '}
            <span
              className={
                rateLimit.remaining <= 2 ? 'text-red-400' : 'text-green-400'
              }
            >
              {rateLimit.remaining}/{rateLimit.limit}
            </span>{' '}
            queries remaining today
          </p>
        )}
      </div>

      {/* Recent Reports */}
      {history.length > 0 && (
        <div className="glass-panel p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Recent Reports
          </h2>
          <div className="space-y-2">
            {history.slice(0, 5).map((report) => {
              const base = variant ? `/${variant}` : '';
              return (
                <button
                  key={report.id}
                  onClick={() => {
                    setCurrentReport(report);
                    navigate(`${base}/report/${report.id}`);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-md bg-gray-800/30 hover:bg-gray-800/50 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-medium text-gray-200">
                      {report.topic}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="threat-badge tlp-green text-[10px]">
                      {report.tlp}
                    </span>
                    <span className="text-xs text-gray-500">{report.tier}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
