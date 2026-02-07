import React from 'react';
import { useNavigate } from 'react-router-dom';

const VARIANTS = [
  {
    id: '1',
    name: 'SOC Operator',
    description: 'Terminal-inspired dark theme with green accents, monospace fonts, and scan-line effects. Built for the night shift.',
    colors: ['#0a0a0a', '#00ff41', '#0d1a0d', '#1a3a1a'],
    accent: 'from-green-500 to-emerald-500',
    icon: '💻',
  },
  {
    id: '2',
    name: 'Intelligence Agency',
    description: 'Formal navy and cream palette with serif typography, classification banners, and official document styling.',
    colors: ['#1a2332', '#f5f0e8', '#c9a84c', '#2a3a52'],
    accent: 'from-amber-500 to-yellow-600',
    icon: '🏛️',
  },
  {
    id: '3',
    name: 'Threat Hunter',
    description: 'Aggressive dark theme with red tactical accents, compact data-dense layout, and military-inspired styling.',
    colors: ['#0d0d0d', '#dc2626', '#1a0a0a', '#3a1a1a'],
    accent: 'from-red-600 to-red-500',
    icon: '🎯',
  },
  {
    id: '4',
    name: 'Academic Research',
    description: 'Clean light theme with serif headings, journal-article layout, wide margins, and citation-heavy styling.',
    colors: ['#fafafa', '#1a1a1a', '#f0f0f0', '#e0e0e0'],
    accent: 'from-gray-600 to-gray-500',
    icon: '📚',
  },
  {
    id: '5',
    name: 'Cyberpunk Analyst',
    description: 'Neon-soaked dark theme with cyan and magenta accents, glitch effects, holographic borders, and animated grid.',
    colors: ['#0a0a14', '#00f0ff', '#ff00ff', '#1a0a2a'],
    accent: 'from-cyan-400 to-fuchsia-500',
    icon: '🌐',
  },
];

export const VariantPicker: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          <span className="text-cyber-500">Cyber</span>
          <span className="text-gray-100">BRIEF</span>
        </h1>
        <p className="text-gray-400 text-lg mb-1">Choose your interface variant</p>
        <p className="text-gray-600 text-sm">Each theme provides a unique experience with the same powerful features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => navigate(`/${v.id}/home`)}
            className="group relative p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-600 transition-all text-left overflow-hidden hover:shadow-xl hover:shadow-gray-900/50 hover:-translate-y-1"
          >
            {/* Accent gradient bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.accent} opacity-50 group-hover:opacity-100 transition-opacity`} />

            {/* Color preview swatches */}
            <div className="flex gap-1 mb-4">
              {v.colors.map((color, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-md border border-gray-700 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{v.icon}</span>
              <div>
                <span className="text-xs font-mono text-gray-600 block">VARIANT {v.id}</span>
                <h2 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                  {v.name}
                </h2>
              </div>
            </div>

            <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>

            <div className="mt-4 text-xs text-gray-600 group-hover:text-gray-400 transition-colors flex items-center gap-1">
              Launch interface <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
