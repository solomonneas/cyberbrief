import React, { useState } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { ResearchTier, TLPLevel, ApiKeys } from '../types';

const TIERS: { value: ResearchTier; label: string }[] = [
  { value: 'FREE', label: 'Free' },
  { value: 'STANDARD', label: 'Standard' },
  { value: 'DEEP', label: 'Deep Research' },
];

const TLP_OPTIONS: { value: TLPLevel; label: string; color: string }[] = [
  { value: 'TLP:CLEAR', label: 'TLP:CLEAR', color: 'text-white' },
  { value: 'TLP:GREEN', label: 'TLP:GREEN', color: 'text-green-400' },
  { value: 'TLP:AMBER', label: 'TLP:AMBER', color: 'text-amber-400' },
  { value: 'TLP:AMBER+STRICT', label: 'TLP:AMBER+STRICT', color: 'text-orange-400' },
  { value: 'TLP:RED', label: 'TLP:RED', color: 'text-red-400' },
];

const API_KEY_FIELDS: { key: keyof ApiKeys; label: string; placeholder: string }[] = [
  { key: 'brave', label: 'Brave Search', placeholder: 'BSA...' },
  { key: 'gemini', label: 'Google Gemini', placeholder: 'AIza...' },
  { key: 'perplexity', label: 'Perplexity', placeholder: 'pplx-...' },
  { key: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
  { key: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-...' },
];

export const SettingsPage: React.FC = () => {
  const {
    defaultTier,
    defaultTlp,
    apiKeys,
    setDefaultTier,
    setDefaultTlp,
    setApiKey,
    removeApiKey,
    reset,
  } = useSettingsStore();

  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});

  const toggleShowKey = (key: string) =>
    setShowKeys((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSaveKey = (provider: keyof ApiKeys) => {
    const value = keyInputs[provider];
    if (value && value.trim()) {
      setApiKey(provider, value.trim());
      setKeyInputs((prev) => ({ ...prev, [provider]: '' }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-100 mb-8">⚙️ Settings</h1>

      {/* Default Tier */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          Default Research Tier
        </h2>
        <div className="flex gap-3">
          {TIERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setDefaultTier(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                defaultTier === t.value
                  ? 'bg-cyber-500/20 text-cyber-400 border border-cyber-500/30'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Default TLP */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          Default TLP Level
        </h2>
        <div className="flex flex-wrap gap-2">
          {TLP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDefaultTlp(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                defaultTlp === opt.value
                  ? `${opt.color} bg-gray-800 border-2 border-current`
                  : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Keys (BYOK) */}
      <div className="glass-panel p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-2">
          API Keys (BYOK)
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Keys are stored locally in your browser. Never sent to third parties.
        </p>
        <div className="space-y-4">
          {API_KEY_FIELDS.map((field) => {
            const existing = apiKeys[field.key];
            const masked = existing
              ? `${existing.substring(0, 6)}${'•'.repeat(20)}`
              : null;

            return (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  {field.label}
                </label>
                {existing ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-gray-800 px-3 py-2 rounded text-gray-400 font-mono">
                      {showKeys[field.key] ? existing : masked}
                    </code>
                    <button
                      onClick={() => toggleShowKey(field.key)}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-gray-200"
                    >
                      {showKeys[field.key] ? 'Hide' : 'Show'}
                    </button>
                    <button
                      onClick={() => removeApiKey(field.key)}
                      className="px-2 py-1 text-xs text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={keyInputs[field.key] ?? ''}
                      onChange={(e) =>
                        setKeyInputs((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      placeholder={field.placeholder}
                      className="flex-1 bg-gray-800/50 border border-gray-700 rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyber-500/50"
                    />
                    <button
                      onClick={() => handleSaveKey(field.key)}
                      disabled={!keyInputs[field.key]?.trim()}
                      className="px-3 py-2 text-sm bg-cyber-500/20 text-cyber-400 rounded hover:bg-cyber-500/30 disabled:opacity-40 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-2">
          Reset Settings
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          Reset all settings to defaults. API keys will be removed.
        </p>
        <button
          onClick={() => {
            if (window.confirm('Reset all settings to defaults?')) {
              reset();
            }
          }}
          className="px-4 py-2 text-sm rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};
