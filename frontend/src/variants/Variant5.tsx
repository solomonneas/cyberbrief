import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';
import { useResearchStore } from '../stores/researchStore';

/**
 * Variant 5 — Cyberpunk Analyst
 * Dark with neon cyan (#00f0ff) and magenta (#ff00ff) accents,
 * glitch text effects, holographic card borders, futuristic fonts
 * (Orbitron headings, Share Tech Mono body), animated grid background.
 */

const NAV_ITEMS = [
  { path: 'home', label: 'HOME', icon: '◇', tourId: '' },
  { path: 'report/latest', label: 'REPORT', icon: '◆', tourId: '' },
  { path: 'attack', label: 'ATT&CK', icon: '⟐', tourId: 'nav-attack' },
  { path: 'history', label: 'HISTORY', icon: '⟁', tourId: '' },
  { path: 'settings', label: 'CONFIG', icon: '⟡', tourId: 'nav-settings' },
  { path: 'docs', label: 'DOCS', icon: '📖', tourId: '' },
];

const theme = { id: '5', name: 'Cyberpunk Analyst', className: 'variant-cyberpunk' };

export const Variant5: React.FC = () => {
  const location = useLocation();
  const tier = useSettingsStore((s) => s.defaultTier);
  const rateLimit = useResearchStore((s) => s.rateLimit);

  return (
    <ThemeProvider theme={theme}>
      <div className="variant-cyberpunk min-h-screen flex flex-col" style={{
        '--cp-bg': '#0a0a14',
        '--cp-cyan': '#00f0ff',
        '--cp-magenta': '#ff00ff',
        '--cp-panel': '#0f0f1a',
        '--cp-border': '#1a1a2e',
        '--cp-text': '#c8c8e0',
        '--cp-muted': '#5a5a7a',
      } as React.CSSProperties}>

        {/* Animated grid background */}
        <div className="cp-grid-bg fixed inset-0 z-0 pointer-events-none" />

        {/* Scan-line overlay */}
        <div className="pointer-events-none fixed inset-0 z-[100]" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0, 240, 255, 0.008) 3px, rgba(0, 240, 255, 0.008) 6px)',
        }} />

        {/* Nav bar */}
        <nav className="sticky top-0 z-50 border-b" style={{
          backgroundColor: 'rgba(10, 10, 20, 0.95)',
          borderColor: 'var(--cp-border)',
          backdropFilter: 'blur(12px)',
          fontFamily: "'Orbitron', sans-serif",
        }}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              {/* Brand — glitch effect */}
              <NavLink to="/5/home" className="flex items-center gap-3">
                <div className="cp-glitch-wrapper relative">
                  <span className="text-lg font-black tracking-wider cp-glitch" data-text="CyberBRIEF" style={{
                    fontFamily: "'Orbitron', sans-serif",
                    background: 'linear-gradient(135deg, #00f0ff, #ff00ff)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    CyberBRIEF
                  </span>
                </div>
                <span className="text-[9px] tracking-[0.3em] uppercase px-2 py-0.5 rounded border" style={{
                  color: 'var(--cp-cyan)',
                  borderColor: 'var(--cp-cyan)',
                  opacity: 0.5,
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  v0.1
                </span>
              </NavLink>

              {/* Nav items */}
              <div className="flex items-center gap-0.5">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname.startsWith(`/5/${item.path.split('/')[0]}`);
                  return (
                    <NavLink
                      key={item.path}
                      to={`/5/${item.path}`}
                      className="relative px-4 py-2 text-xs font-medium tracking-wider transition-all"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        color: isActive ? '#0a0a14' : 'var(--cp-muted)',
                        background: isActive
                          ? 'linear-gradient(135deg, #00f0ff, #ff00ff)'
                          : 'transparent',
                        clipPath: isActive
                          ? 'polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)'
                          : 'none',
                      }}
                    >
                      <span className="mr-1.5 text-[10px]">{item.icon}</span>
                      {item.label}
                      {!isActive && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px group-hover:w-full transition-all" style={{
                          backgroundColor: 'var(--cp-cyan)',
                        }} />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 relative z-10 pb-12" style={{
          backgroundColor: 'transparent',
          color: 'var(--cp-text)',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <Outlet />
        </main>

        {/* Status bar */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{
          backgroundColor: 'rgba(10, 10, 20, 0.95)',
          borderColor: 'var(--cp-border)',
          backdropFilter: 'blur(12px)',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-3" style={{ color: 'var(--cp-muted)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full cp-neon-pulse" style={{ backgroundColor: 'var(--cp-cyan)' }} />
                <span style={{ color: 'var(--cp-cyan)' }}>CONNECTED</span>
              </span>
              <span style={{ color: 'var(--cp-border)' }}>|</span>
              <span>TIER: <span style={{ color: 'var(--cp-magenta)' }}>{tier}</span></span>
            </div>
            <div className="flex items-center gap-3" style={{ color: 'var(--cp-muted)' }}>
              {tier === 'FREE' && (
                <>
                  <span>
                    QUOTA: <span style={{ color: rateLimit.remaining > 2 ? 'var(--cp-cyan)' : 'var(--cp-magenta)' }}>
                      {rateLimit.remaining}/{rateLimit.limit}
                    </span>
                  </span>
                  <span style={{ color: 'var(--cp-border)' }}>|</span>
                </>
              )}
              <span>SYS: <span style={{ color: 'var(--cp-cyan)' }}>NOMINAL</span></span>
            </div>
          </div>
        </footer>
      </div>

      {/* Variant-specific styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Share+Tech+Mono&display=swap');

        .variant-cyberpunk {
          font-family: 'Share Tech Mono', monospace;
          background-color: #0a0a14;
        }
        .variant-cyberpunk h1, .variant-cyberpunk h2, .variant-cyberpunk h3 {
          font-family: 'Orbitron', sans-serif;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #f0f0ff;
        }

        /* Animated grid background */
        .cp-grid-bg {
          background-image:
            linear-gradient(rgba(0, 240, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 240, 255, 0.03) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridShift 20s linear infinite;
        }
        @keyframes gridShift {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        /* Glitch text effect */
        .cp-glitch {
          position: relative;
          display: inline-block;
        }
        .cp-glitch::before,
        .cp-glitch::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #0a0a14;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cp-glitch::before {
          animation: cpGlitch1 3s infinite;
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          background: linear-gradient(135deg, #00f0ff, #00f0ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cp-glitch::after {
          animation: cpGlitch2 3s infinite;
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          background: linear-gradient(135deg, #ff00ff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes cpGlitch1 {
          0%, 90%, 100% { transform: translate(0); }
          92% { transform: translate(2px, -1px); }
          94% { transform: translate(-2px, 1px); }
          96% { transform: translate(1px, 0); }
        }
        @keyframes cpGlitch2 {
          0%, 90%, 100% { transform: translate(0); }
          91% { transform: translate(-2px, 1px); }
          93% { transform: translate(2px, -1px); }
          95% { transform: translate(-1px, 0); }
        }

        /* Neon pulse for status dot */
        .cp-neon-pulse {
          animation: neonPulse 2s ease-in-out infinite;
        }
        @keyframes neonPulse {
          0%, 100% { box-shadow: 0 0 4px #00f0ff, 0 0 8px #00f0ff; }
          50% { box-shadow: 0 0 8px #00f0ff, 0 0 16px #00f0ff, 0 0 24px rgba(0, 240, 255, 0.3); }
        }

        /* Panel styles — holographic borders */
        .variant-cyberpunk .glass-panel {
          background: rgba(15, 15, 26, 0.9);
          border: 1px solid transparent;
          border-image: linear-gradient(135deg, #00f0ff44, #ff00ff44, #00f0ff44) 1;
          position: relative;
        }
        .variant-cyberpunk .glass-panel:hover {
          border-image: linear-gradient(135deg, #00f0ff88, #ff00ff88, #00f0ff88) 1;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.08), 0 0 40px rgba(255, 0, 255, 0.05);
        }
        /* Animated holographic border on hover */
        .variant-cyberpunk .glass-panel::before {
          content: '';
          position: absolute;
          inset: -1px;
          z-index: -1;
          background: linear-gradient(
            var(--holo-angle, 135deg),
            #00f0ff33,
            #ff00ff33,
            #00f0ff33,
            #ff00ff33
          );
          opacity: 0;
          transition: opacity 0.3s;
        }
        .variant-cyberpunk .glass-panel:hover::before {
          opacity: 1;
          animation: holoRotate 3s linear infinite;
        }
        @keyframes holoRotate {
          0% { --holo-angle: 0deg; }
          100% { --holo-angle: 360deg; }
        }
        @property --holo-angle {
          syntax: '<angle>';
          initial-value: 135deg;
          inherits: false;
        }

        .variant-cyberpunk .cyber-glow {
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.2), 0 0 40px rgba(255, 0, 255, 0.1);
        }

        .variant-cyberpunk input[type="text"],
        .variant-cyberpunk input[type="password"],
        .variant-cyberpunk textarea {
          font-family: 'Share Tech Mono', monospace;
          background: #0a0a14;
          border-color: #1a1a2e;
          color: #c8c8e0;
        }
        .variant-cyberpunk input[type="text"]:focus,
        .variant-cyberpunk input[type="password"]:focus {
          border-color: #00f0ff66;
          box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.15), 0 0 10px rgba(0, 240, 255, 0.1);
        }

        /* Override cyber accent to neon cyan */
        .variant-cyberpunk .text-cyber-400 {
          color: #00f0ff !important;
        }
        .variant-cyberpunk .text-cyber-500 {
          color: #ff00ff !important;
        }
        .variant-cyberpunk .bg-cyber-500 {
          background: linear-gradient(135deg, #00f0ff, #ff00ff) !important;
          color: #0a0a14 !important;
        }
        .variant-cyberpunk .bg-cyber-500:hover {
          background: linear-gradient(135deg, #00d4e0, #e000e0) !important;
        }
        .variant-cyberpunk .bg-cyber-500\\/10,
        .variant-cyberpunk .bg-cyber-500\\/20 {
          background-color: rgba(0, 240, 255, 0.1) !important;
        }
        .variant-cyberpunk .border-cyber-500,
        .variant-cyberpunk .border-cyber-500\\/30 {
          border-color: rgba(0, 240, 255, 0.3) !important;
        }
        .variant-cyberpunk .ring-cyber-500\\/50 {
          --tw-ring-color: rgba(0, 240, 255, 0.5) !important;
        }
      `}</style>
    </ThemeProvider>
  );
};
