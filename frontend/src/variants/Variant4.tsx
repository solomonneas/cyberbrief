import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { ThemeProvider } from '../context/ThemeContext';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Variant 4 — Academic Research
 * Light theme (#fafafa bg, #1a1a1a text), serif headings (Merriweather),
 * sans body (Source Sans Pro), journal-article layout with wide margins,
 * footnote indicators, pull quotes, citation-heavy styling.
 */

const NAV_ITEMS = [
  { path: 'home', label: 'Home', tourId: '' },
  { path: 'report/latest', label: 'Reports', tourId: '' },
  { path: 'attack', label: 'ATT&CK Framework', tourId: 'nav-attack' },
  { path: 'history', label: 'Archive', tourId: '' },
  { path: 'settings', label: 'Settings', tourId: 'nav-settings' },
  { path: 'docs', label: 'Documentation', tourId: '' },
];

const theme = { id: '4', name: 'Academic Research', className: 'variant-academic' };

export const Variant4: React.FC = () => {
  const location = useLocation();
  const defaultTlp = useSettingsStore((s) => s.defaultTlp);

  return (
    <ThemeProvider theme={theme}>
      <div className="variant-academic min-h-screen flex flex-col" style={{ backgroundColor: '#fafafa' }}>

        {/* Simple, clean header */}
        <header className="border-b" style={{ borderColor: '#e5e5e5', backgroundColor: '#ffffff' }}>
          <div className="max-w-4xl mx-auto px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand — journal-style */}
              <NavLink to="/4/home" className="flex items-baseline gap-2">
                <h1 className="text-xl font-bold" style={{
                  fontFamily: "'Merriweather', Georgia, serif",
                  color: '#1a1a1a',
                }}>
                  CyberBRIEF
                </h1>
                <span className="text-xs italic" style={{
                  fontFamily: "'Source Sans Pro', 'Source Sans 3', sans-serif",
                  color: '#737373',
                }}>
                  A Journal of Cyber Threat Intelligence
                </span>
              </NavLink>

              {/* Volume / Issue indicator */}
              <div className="text-xs" style={{
                fontFamily: "'Source Sans Pro', 'Source Sans 3', sans-serif",
                color: '#a3a3a3',
              }}>
                Vol. 1 &middot; {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </header>

        {/* Navigation bar — understated horizontal */}
        <nav className="border-b" style={{ borderColor: '#e5e5e5', backgroundColor: '#fafafa' }}>
          <div className="max-w-4xl mx-auto px-8">
            <div className="flex items-center gap-1 h-10">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.startsWith(`/4/${item.path.split('/')[0]}`);
                return (
                  <NavLink
                    key={item.path}
                    to={`/4/${item.path}`}
                    className="px-3 py-1.5 text-sm transition-colors rounded"
                    style={{
                      fontFamily: "'Source Sans Pro', 'Source Sans 3', sans-serif",
                      color: isActive ? '#1a1a1a' : '#737373',
                      fontWeight: isActive ? 600 : 400,
                      borderBottom: isActive ? '2px solid #1a1a1a' : '2px solid transparent',
                    }}
                  >
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main content — journal-article style with wide margins */}
        <main className="flex-1 pb-20" style={{ backgroundColor: '#fafafa' }}>
          <div className="max-w-4xl mx-auto px-8 lg:px-16">
            {/* Decorative rule */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ backgroundColor: '#d4d4d4' }} />
              <div className="text-xs tracking-widest uppercase" style={{
                color: '#a3a3a3',
                fontFamily: "'Source Sans Pro', 'Source Sans 3', sans-serif",
              }}>
                ❖
              </div>
              <div className="flex-1 h-px" style={{ backgroundColor: '#d4d4d4' }} />
            </div>

            <Outlet />
          </div>
        </main>

        {/* Footer — simple academic */}
        <footer className="fixed bottom-0 left-0 right-0 z-40 border-t" style={{
          backgroundColor: '#ffffff',
          borderColor: '#e5e5e5',
        }}>
          <div className="max-w-4xl mx-auto px-8 h-8 flex items-center justify-between text-[10px]" style={{
            fontFamily: "'Source Sans Pro', 'Source Sans 3', sans-serif",
            color: '#a3a3a3',
          }}>
            <span>CyberBRIEF — Cyber Threat Intelligence Research Platform &middot; v0.1.0</span>
            <span>Distribution: {defaultTlp}</span>
          </div>
        </footer>
      </div>

      {/* Variant-specific styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400&display=swap');

        .variant-academic {
          font-family: 'Source Sans 3', 'Source Sans Pro', -apple-system, sans-serif;
          color: #1a1a1a;
          line-height: 1.7;
          font-size: 15px;
        }
        .variant-academic h1, .variant-academic h2, .variant-academic h3 {
          font-family: 'Merriweather', Georgia, serif;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.3;
        }
        .variant-academic h1 { font-size: 1.75rem; margin-bottom: 0.5em; }
        .variant-academic h2 { font-size: 1.35rem; margin-bottom: 0.4em; }
        .variant-academic h3 { font-size: 1.1rem; margin-bottom: 0.3em; }

        .variant-academic .glass-panel {
          background: #ffffff;
          border: 1px solid #e5e5e5;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }
        .variant-academic .glass-panel:hover {
          border-color: #d4d4d4;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
        }
        .variant-academic .cyber-glow {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .variant-academic input[type="text"],
        .variant-academic input[type="password"],
        .variant-academic textarea {
          font-family: 'Source Sans 3', 'Source Sans Pro', sans-serif;
          background: #ffffff;
          border-color: #d4d4d4;
          color: #1a1a1a;
        }
        .variant-academic input[type="text"]:focus,
        .variant-academic input[type="password"]:focus {
          border-color: #737373;
          box-shadow: 0 0 0 2px rgba(115, 115, 115, 0.15);
        }
        /* Override cyber accent colors to dark gray/black for academic look */
        .variant-academic .text-cyber-400,
        .variant-academic .text-cyber-500 {
          color: #404040 !important;
        }
        .variant-academic .bg-cyber-500 {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        .variant-academic .bg-cyber-500:hover {
          background-color: #333333 !important;
        }
        .variant-academic .bg-cyber-500\\/10,
        .variant-academic .bg-cyber-500\\/20 {
          background-color: rgba(26, 26, 26, 0.06) !important;
        }
        .variant-academic .border-cyber-500,
        .variant-academic .border-cyber-500\\/30 {
          border-color: rgba(26, 26, 26, 0.2) !important;
        }
        .variant-academic .ring-cyber-500\\/50 {
          --tw-ring-color: rgba(26, 26, 26, 0.3) !important;
        }
        /* Override dark backgrounds for light theme */
        .variant-academic .bg-gray-900,
        .variant-academic .bg-gray-950 {
          background-color: #fafafa !important;
        }
        .variant-academic .bg-gray-900\\/50 {
          background-color: rgba(250, 250, 250, 0.9) !important;
        }
        .variant-academic .bg-gray-800,
        .variant-academic .bg-gray-800\\/50 {
          background-color: #f0f0f0 !important;
        }
        .variant-academic .text-gray-100,
        .variant-academic .text-gray-200 {
          color: #1a1a1a !important;
        }
        .variant-academic .text-gray-300,
        .variant-academic .text-gray-400 {
          color: #525252 !important;
        }
        .variant-academic .text-gray-500 {
          color: #737373 !important;
        }
        .variant-academic .text-gray-600 {
          color: #a3a3a3 !important;
        }
        .variant-academic .border-gray-700,
        .variant-academic .border-gray-800 {
          border-color: #e5e5e5 !important;
        }
        /* Pull-quote styling for blockquotes */
        .variant-academic blockquote {
          font-family: 'Merriweather', Georgia, serif;
          font-style: italic;
          font-size: 1.1em;
          border-left: 3px solid #d4d4d4;
          padding-left: 1.5em;
          margin: 1.5em 0;
          color: #404040;
        }
        /* Footnote-style superscript markers */
        .variant-academic sup {
          font-size: 0.7em;
          color: #737373;
          font-weight: 600;
        }
      `}</style>
    </ThemeProvider>
  );
};
