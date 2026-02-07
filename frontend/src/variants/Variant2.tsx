import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Variant 2 — Intelligence Agency
 * Navy/cream palette, serif fonts, classification banner,
 * gold accents, official document styling.
 */

const NAV_ITEMS = [
  { path: 'home', label: 'Home', icon: '⌂' },
  { path: 'report/latest', label: 'Reports', icon: '◆' },
  { path: 'attack', label: 'ATT&CK', icon: '◆' },
  { path: 'history', label: 'Archive', icon: '◆' },
  { path: 'settings', label: 'Administration', icon: '◆' },
];

const theme = { id: '2', name: 'Intelligence Agency', className: 'variant-intel' };

export const Variant2: React.FC = () => {
  const location = useLocation();
  const defaultTlp = useSettingsStore((s) => s.defaultTlp);

  return (
    <ThemeProvider theme={theme}>
      <div className="variant-intel min-h-screen flex flex-col" style={{ backgroundColor: '#1a2332' }}>
        {/* Classification Banner */}
        <div className="text-center py-1.5 text-xs font-bold tracking-[0.3em] uppercase" style={{
          backgroundColor: '#2a5a2a',
          color: '#ffffff',
          fontFamily: "'Georgia', serif",
          letterSpacing: '0.25em',
        }}>
          UNCLASSIFIED // FOR OFFICIAL USE ONLY
        </div>

        {/* Header with seal area */}
        <header className="border-b" style={{ borderColor: '#c9a84c33', backgroundColor: '#1a2332' }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Brand / Seal area */}
              <NavLink to="/2/home" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                  style={{ borderColor: '#c9a84c', color: '#c9a84c', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  CB
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: '#f5f0e8', fontFamily: "'Playfair Display', Georgia, serif" }}>
                    CyberBRIEF
                  </div>
                  <div className="text-[9px] tracking-wider uppercase" style={{ color: '#c9a84c88' }}>
                    Intelligence Research Platform
                  </div>
                </div>
              </NavLink>

              {/* Navigation */}
              <nav className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = location.pathname.startsWith(`/2/${item.path.split('/')[0]}`);
                  return (
                    <NavLink
                      key={item.path}
                      to={`/2/${item.path}`}
                      className="px-4 py-2 text-sm transition-all"
                      style={{
                        fontFamily: "'Georgia', serif",
                        color: isActive ? '#c9a84c' : '#8899aa',
                        borderBottom: isActive ? '2px solid #c9a84c' : '2px solid transparent',
                      }}
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        {/* Document-style main content with letterhead borders */}
        <main className="flex-1 pb-16" style={{ backgroundColor: '#1a2332' }}>
          <div className="relative">
            {/* Letterhead left border */}
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-px" style={{ backgroundColor: '#c9a84c22' }} />
            <div className="hidden lg:block absolute left-1 top-0 bottom-0 w-px" style={{ backgroundColor: '#c9a84c11' }} />
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{
          backgroundColor: '#1a2332',
          borderColor: '#c9a84c22',
        }}>
          <div className="max-w-7xl mx-auto px-6 h-8 flex items-center justify-between text-[10px]" style={{
            fontFamily: "'Georgia', serif",
            color: '#556677',
          }}>
            <span>CyberBRIEF — Intelligence Research Platform v0.1.0</span>
            <span>Classification: {defaultTlp}</span>
          </div>
        </footer>

        {/* Classification banner bottom */}
        <div className="fixed bottom-8 left-0 right-0 z-30 text-center py-1 text-[9px] font-bold tracking-[0.3em] uppercase" style={{
          backgroundColor: '#2a5a2a',
          color: '#ffffff',
        }}>
          UNCLASSIFIED // FOR OFFICIAL USE ONLY
        </div>
      </div>

      {/* Variant-specific styles */}
      <style>{`
        .variant-intel {
          font-family: 'Georgia', serif;
          color: #d0c8b8;
        }
        .variant-intel h1, .variant-intel h2, .variant-intel h3 {
          font-family: 'Playfair Display', 'Georgia', serif;
          color: #f5f0e8;
        }
        .variant-intel .glass-panel {
          background: rgba(26, 35, 50, 0.95);
          border: 1px solid #c9a84c22;
          border-radius: 4px;
        }
        .variant-intel .glass-panel:hover {
          border-color: #c9a84c44;
        }
        .variant-intel .cyber-glow {
          box-shadow: 0 0 20px rgba(201, 168, 76, 0.15);
        }
        .variant-intel input[type="text"],
        .variant-intel input[type="password"],
        .variant-intel textarea {
          font-family: 'Georgia', serif;
          background: #0f1722;
          border-color: #2a3a52;
        }
        .variant-intel input[type="text"]:focus,
        .variant-intel input[type="password"]:focus {
          border-color: #c9a84c66;
          box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.1);
        }
        /* Override cyber colors for gold accent */
        .variant-intel .text-cyber-400,
        .variant-intel .text-cyber-500 {
          color: #c9a84c !important;
        }
        .variant-intel .bg-cyber-500 {
          background-color: #c9a84c !important;
          color: #1a2332 !important;
        }
        .variant-intel .bg-cyber-500:hover {
          background-color: #b8973b !important;
        }
        .variant-intel .bg-cyber-500\\/10,
        .variant-intel .bg-cyber-500\\/20 {
          background-color: rgba(201, 168, 76, 0.1) !important;
        }
        .variant-intel .border-cyber-500,
        .variant-intel .border-cyber-500\\/30 {
          border-color: rgba(201, 168, 76, 0.3) !important;
        }
        .variant-intel .ring-cyber-500\\/50 {
          --tw-ring-color: rgba(201, 168, 76, 0.5) !important;
        }
      `}</style>
    </ThemeProvider>
  );
};
