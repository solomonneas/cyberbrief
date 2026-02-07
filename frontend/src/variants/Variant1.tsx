import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';
import { useResearchStore } from '../stores/researchStore';

/**
 * Variant 1 — SOC Operator
 * Terminal-inspired dark theme with green accents (#00ff41),
 * monospace fonts, glowing borders, scan-line overlay, pulsing status dots.
 */

const NAV_ITEMS = [
  { path: 'home', label: 'home', icon: '~', tourId: '' },
  { path: 'report/latest', label: 'report', icon: '>', tourId: '' },
  { path: 'attack', label: 'attack', icon: '>', tourId: 'nav-attack' },
  { path: 'history', label: 'history', icon: '>', tourId: '' },
  { path: 'settings', label: 'config', icon: '>', tourId: 'nav-settings' },
  { path: 'docs', label: 'docs', icon: '>', tourId: '' },
];

const theme = { id: '1', name: 'SOC Operator', className: 'variant-soc' };

export const Variant1: React.FC = () => {
  const location = useLocation();
  const tier = useSettingsStore((s) => s.defaultTier);
  const rateLimit = useResearchStore((s) => s.rateLimit);

  return (
    <ThemeProvider theme={theme}>
      <div className="variant-soc min-h-screen flex flex-col" style={{
        '--soc-bg': '#0a0a0a',
        '--soc-green': '#00ff41',
        '--soc-green-dim': '#00cc33',
        '--soc-panel': '#0d0d0d',
        '--soc-border': '#1a3a1a',
      } as React.CSSProperties}>
        {/* Scan-line overlay */}
        <div className="pointer-events-none fixed inset-0 z-[100]" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 65, 0.015) 2px, rgba(0, 255, 65, 0.015) 4px)',
        }} />

        {/* Terminal-style nav bar */}
        <nav className="sticky top-0 z-50 border-b" style={{
          backgroundColor: 'var(--soc-bg)',
          borderColor: 'var(--soc-border)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-12">
              {/* Brand */}
              <NavLink to="/1/home" className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--soc-green)' }}>root@cyberbrief</span>
                <span className="text-gray-600 text-xs">:</span>
                <span className="text-blue-400 text-xs">~</span>
                <span className="text-gray-600 text-xs">$</span>
                <span className="w-2 h-4 inline-block animate-pulse" style={{ backgroundColor: 'var(--soc-green)' }} />
              </NavLink>

              {/* Nav items as terminal tabs */}
              <div className="flex items-center gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname.startsWith(`/1/${item.path.split('/')[0]}`);
                  return (
                    <NavLink
                      key={item.path}
                      to={`/1/${item.path}`}
                      className="px-3 py-1.5 text-xs font-mono transition-all rounded-sm"
                      style={{
                        color: isActive ? '#0a0a0a' : 'var(--soc-green-dim)',
                        backgroundColor: isActive ? 'var(--soc-green)' : 'transparent',
                        opacity: isActive ? 1 : 0.7,
                      }}
                      {...(item.tourId ? { 'data-tour': item.tourId } : {})}
                    >
                      <span className="text-[10px] opacity-60">{item.icon}</span> {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <main className="flex-1 pb-10" style={{
          backgroundColor: 'var(--soc-bg)',
          color: '#c0c0c0',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          <Outlet />
        </main>

        {/* Status bar */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{
          backgroundColor: 'var(--soc-bg)',
          borderColor: 'var(--soc-border)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        }}>
          <div className="max-w-7xl mx-auto px-4 h-7 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-3" style={{ color: 'var(--soc-green-dim)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--soc-green)' }} />
                ONLINE
              </span>
              <span className="text-gray-700">|</span>
              <span>CyberBRIEF v0.1.0</span>
              <span className="text-gray-700">|</span>
              <span>TIER: {tier}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              {tier === 'FREE' && (
                <span>
                  QUOTA: <span style={{ color: rateLimit.remaining > 2 ? 'var(--soc-green)' : '#ff4444' }}>
                    {rateLimit.remaining}/{rateLimit.limit}
                  </span>
                </span>
              )}
              <span className="text-gray-700">|</span>
              <span>PID: {Math.floor(Math.random() * 9000 + 1000)}</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Variant-specific styles */}
      <style>{`
        .variant-soc .glass-panel {
          background: rgba(13, 13, 13, 0.9);
          border: 1px solid #1a3a1a;
          box-shadow: 0 0 10px rgba(0, 255, 65, 0.05), inset 0 0 20px rgba(0, 255, 65, 0.02);
        }
        .variant-soc .glass-panel:hover {
          border-color: #2a5a2a;
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.1), inset 0 0 30px rgba(0, 255, 65, 0.03);
        }
        .variant-soc .cyber-glow {
          box-shadow: 0 0 20px rgba(0, 255, 65, 0.2), 0 0 40px rgba(0, 255, 65, 0.1);
        }
        .variant-soc input[type="text"],
        .variant-soc input[type="password"] {
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
      `}</style>
    </ThemeProvider>
  );
};
