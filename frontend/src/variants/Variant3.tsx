import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';
import { useResearchStore } from '../stores/researchStore';

/**
 * Variant 3 — Threat Hunter
 * Very dark background (#0d0d0d), aggressive red accents (#dc2626),
 * angular/sharp military/tactical styling, stencil-like fonts,
 * data-dense compact layout, tactical sidebar navigation.
 */

const NAV_ITEMS = [
  { path: 'home', label: 'DASHBOARD', icon: '⬡', tourId: '' },
  { path: 'report/latest', label: 'INTEL REPORT', icon: '⬢', tourId: '' },
  { path: 'attack', label: 'ATT&CK MAP', icon: '◈', tourId: 'nav-attack' },
  { path: 'history', label: 'OP HISTORY', icon: '▣', tourId: '' },
  { path: 'settings', label: 'SYS CONFIG', icon: '⚙', tourId: 'nav-settings' },
  { path: 'docs', label: 'FIELD MANUAL', icon: '📋', tourId: '' },
];

const THREAT_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const THREAT_COLORS: Record<string, string> = {
  CRITICAL: '#dc2626',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
};

const theme = { id: '3', name: 'Threat Hunter', className: 'variant-hunter' };

export const Variant3: React.FC = () => {
  const location = useLocation();
  const tier = useSettingsStore((s) => s.defaultTier);
  const rateLimit = useResearchStore((s) => s.rateLimit);

  return (
    <ThemeProvider theme={theme}>
      <div className="variant-hunter min-h-screen flex" style={{
        '--hunter-bg': '#0d0d0d',
        '--hunter-red': '#dc2626',
        '--hunter-red-dim': '#991b1b',
        '--hunter-panel': '#111111',
        '--hunter-border': '#2a1a1a',
        '--hunter-text': '#d4d4d4',
        '--hunter-muted': '#737373',
      } as React.CSSProperties}>

        {/* Tactical Sidebar */}
        <nav className="fixed top-0 left-0 bottom-0 z-50 w-56 flex flex-col border-r" style={{
          backgroundColor: '#0a0a0a',
          borderColor: 'var(--hunter-border)',
          fontFamily: "'Rajdhani', 'Oswald', sans-serif",
        }}>
          {/* Brand / callsign */}
          <NavLink to="/home" className="flex items-center gap-2.5 px-4 py-4 border-b" style={{ borderColor: 'var(--hunter-border)' }}>
            <div className="w-8 h-8 flex items-center justify-center text-xs font-black" style={{
              backgroundColor: 'var(--hunter-red)',
              color: '#ffffff',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            }}>
              CB
            </div>
            <div>
              <div className="text-sm font-bold tracking-wider uppercase" style={{ color: 'var(--hunter-red)' }}>
                CyberBRIEF
              </div>
              <div className="text-[9px] tracking-widest uppercase" style={{ color: 'var(--hunter-muted)' }}>
                THREAT OPS
              </div>
            </div>
          </NavLink>

          {/* Threat Level Indicator */}
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--hunter-border)' }}>
            <div className="text-[9px] tracking-widest uppercase mb-2" style={{ color: 'var(--hunter-muted)', fontFamily: "'Rajdhani', sans-serif" }}>
              THREAT LEVEL
            </div>
            <div className="flex gap-1">
              {THREAT_LEVELS.map((level) => (
                <div key={level} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-1.5 rounded-sm" style={{
                    backgroundColor: level === 'HIGH' ? THREAT_COLORS[level] : `${THREAT_COLORS[level]}33`,
                  }} />
                  <span className="text-[7px] tracking-wider" style={{
                    color: level === 'HIGH' ? THREAT_COLORS[level] : 'var(--hunter-muted)',
                  }}>{level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav items */}
          <div className="flex-1 py-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname.startsWith(`/${item.path.split('/')[0]}`);
              return (
                <NavLink
                  key={item.path}
                  to={`/${item.path}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold tracking-wider transition-all"
                  style={{
                    fontFamily: "'Rajdhani', 'Oswald', sans-serif",
                    color: isActive ? '#ffffff' : 'var(--hunter-muted)',
                    backgroundColor: isActive ? 'var(--hunter-red)' : 'transparent',
                    borderLeft: isActive ? '3px solid #ffffff' : '3px solid transparent',
                  }}
                >
                  <span className="text-sm" style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              );
            })}
          </div>

          {/* Radar decorative element */}
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--hunter-border)' }}>
            <div className="relative w-full aspect-square max-w-[120px] mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ opacity: 0.2 }}>
                <circle cx="50" cy="50" r="45" fill="none" stroke="#dc2626" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="#dc2626" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="15" fill="none" stroke="#dc2626" strokeWidth="0.5" />
                <line x1="50" y1="5" x2="50" y2="95" stroke="#dc2626" strokeWidth="0.3" />
                <line x1="5" y1="50" x2="95" y2="50" stroke="#dc2626" strokeWidth="0.3" />
                <line x1="50" y1="50" x2="85" y2="25" stroke="#dc2626" strokeWidth="1" className="radar-sweep" />
                <circle cx="65" cy="35" r="2" fill="#dc2626" className="animate-pulse" />
                <circle cx="38" cy="62" r="1.5" fill="#dc2626" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
              </svg>
            </div>
          </div>

          {/* Status */}
          <div className="px-4 py-3 border-t text-[9px] tracking-wider" style={{
            borderColor: 'var(--hunter-border)',
            color: 'var(--hunter-muted)',
            fontFamily: "'Rajdhani', sans-serif",
          }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--hunter-red)' }} />
              ACTIVE HUNTING
            </div>
            <div>TIER: {tier}</div>
            {tier === 'FREE' && (
              <div>SCANS: {rateLimit.remaining}/{rateLimit.limit}</div>
            )}
          </div>
        </nav>

        {/* Main content — offset by sidebar width */}
        <main className="flex-1 ml-56 min-h-screen" style={{
          backgroundColor: 'var(--hunter-bg)',
          color: 'var(--hunter-text)',
          fontFamily: "'Rajdhani', 'Oswald', sans-serif",
        }}>
          {/* Top status strip */}
          <div className="sticky top-0 z-40 h-8 flex items-center justify-between px-4 border-b text-[10px] tracking-wider uppercase" style={{
            backgroundColor: '#0a0a0a',
            borderColor: 'var(--hunter-border)',
            color: 'var(--hunter-muted)',
          }}>
            <div className="flex items-center gap-4">
              <span>CyberBRIEF v0.1.0</span>
              <span style={{ color: 'var(--hunter-border)' }}>|</span>
              <span>CLASSIFICATION: <span style={{ color: 'var(--hunter-red)' }}>RESTRICTED</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span>{new Date().toISOString().split('T')[0]}</span>
              <span style={{ color: 'var(--hunter-border)' }}>|</span>
              <span>OPS STATUS: <span style={{ color: 'var(--hunter-red)' }}>ACTIVE</span></span>
            </div>
          </div>

          <div className="pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Variant-specific styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap');

        .variant-hunter {
          font-family: 'Rajdhani', 'Oswald', sans-serif;
        }
        .variant-hunter h1, .variant-hunter h2, .variant-hunter h3 {
          font-family: 'Oswald', 'Rajdhani', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #f5f5f5;
        }
        .variant-hunter .glass-panel {
          background: rgba(17, 17, 17, 0.95);
          border: 1px solid #2a1a1a;
          border-left: 3px solid #dc262644;
        }
        .variant-hunter .glass-panel:hover {
          border-color: #3a2a2a;
          border-left-color: #dc2626;
        }
        .variant-hunter .cyber-glow {
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.2), 0 0 40px rgba(220, 38, 38, 0.1);
        }
        .variant-hunter input[type="text"],
        .variant-hunter input[type="password"],
        .variant-hunter textarea {
          font-family: 'Rajdhani', sans-serif;
          background: #0a0a0a;
          border-color: #2a1a1a;
        }
        .variant-hunter input[type="text"]:focus,
        .variant-hunter input[type="password"]:focus {
          border-color: #dc262666;
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.15);
        }
        /* Override cyber accent colors to red */
        .variant-hunter .text-cyber-400,
        .variant-hunter .text-cyber-500 {
          color: #dc2626 !important;
        }
        .variant-hunter .bg-cyber-500 {
          background-color: #dc2626 !important;
          color: #ffffff !important;
        }
        .variant-hunter .bg-cyber-500:hover {
          background-color: #b91c1c !important;
        }
        .variant-hunter .bg-cyber-500\\/10,
        .variant-hunter .bg-cyber-500\\/20 {
          background-color: rgba(220, 38, 38, 0.1) !important;
        }
        .variant-hunter .border-cyber-500,
        .variant-hunter .border-cyber-500\\/30 {
          border-color: rgba(220, 38, 38, 0.3) !important;
        }
        .variant-hunter .ring-cyber-500\\/50 {
          --tw-ring-color: rgba(220, 38, 38, 0.5) !important;
        }
        /* Radar sweep animation */
        .radar-sweep {
          transform-origin: 50px 50px;
          animation: radarSweep 4s linear infinite;
        }
        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ThemeProvider>
  );
};
