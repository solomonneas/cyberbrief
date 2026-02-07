import React from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useResearchStore } from '../stores/researchStore';

export const StatusBar: React.FC = () => {
  const tier = useSettingsStore((s) => s.defaultTier);
  const rateLimit = useResearchStore((s) => s.rateLimit);

  const tierColors: Record<string, string> = {
    FREE: 'text-green-400',
    STANDARD: 'text-cyber-400',
    DEEP: 'text-purple-400',
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/90 backdrop-blur-md border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>CyberBRIEF v0.1.0</span>
          <span className="text-gray-700">|</span>
          <span>
            Tier:{' '}
            <span className={tierColors[tier] ?? 'text-gray-400'}>
              {tier}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {tier === 'FREE' && (
            <span>
              Free queries:{' '}
              <span
                className={
                  rateLimit.remaining <= 2 ? 'text-red-400' : 'text-green-400'
                }
              >
                {rateLimit.remaining}/{rateLimit.limit}
              </span>{' '}
              remaining today
            </span>
          )}
          <span className="text-gray-700">|</span>
          <span>Powered by Brave Search + Gemini Flash</span>
        </div>
      </div>
    </footer>
  );
};
