import React from 'react';
import { NavLink, useParams } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  tourId?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: 'home', label: 'Home', icon: '🏠' },
  { path: 'report', label: 'Report View', icon: '📄' },
  { path: 'attack', label: "ATT&CK Explorer", icon: '🎯', tourId: 'nav-attack' },
  { path: 'history', label: 'History', icon: '📜' },
  { path: 'settings', label: 'Settings', icon: '⚙️', tourId: 'nav-settings' },
  { path: 'docs', label: 'Docs', icon: '📚' },
];

export const Navbar: React.FC = () => {
  const { variant } = useParams<{ variant: string }>();
  const base = variant ? `/${variant}` : '';

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/90 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <NavLink
            to={`${base}/home`}
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <span className="text-cyber-500">Cyber</span>
            <span className="text-gray-100">BRIEF</span>
            <span className="text-[10px] font-mono text-gray-500 ml-1 mt-1">
              v0.1.0
            </span>
          </NavLink>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={
                  item.path === 'report'
                    ? `${base}/report/latest`
                    : `${base}/${item.path}`
                }
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyber-500/10 text-cyber-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                  }`
                }
                {...(item.tourId ? { 'data-tour': item.tourId } : {})}
              >
                <span className="text-xs">{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};
