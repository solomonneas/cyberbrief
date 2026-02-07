import React from 'react';
import { useNavigate } from 'react-router-dom';

const VARIANTS = [
  {
    id: '1',
    name: 'Command Center',
    description: 'Military-inspired dark theme with structured panels',
    accent: 'from-cyan-500 to-blue-500',
  },
  {
    id: '2',
    name: 'Neon Grid',
    description: 'Cyberpunk aesthetic with neon accents and grid layout',
    accent: 'from-purple-500 to-pink-500',
  },
  {
    id: '3',
    name: 'Clean Intel',
    description: 'Minimalist design focused on readability and data',
    accent: 'from-emerald-500 to-teal-500',
  },
  {
    id: '4',
    name: 'Threat Matrix',
    description: 'Dense information display with matrix-style elements',
    accent: 'from-red-500 to-orange-500',
  },
  {
    id: '5',
    name: 'Analyst Desktop',
    description: 'Multi-panel layout inspired by SIEM dashboards',
    accent: 'from-amber-500 to-yellow-500',
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
        <p className="text-gray-400 text-lg">
          Choose your interface variant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            onClick={() => navigate(`/${v.id}/home`)}
            className="group relative p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-gray-600 transition-all text-left overflow-hidden"
          >
            {/* Accent gradient bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${v.accent} opacity-50 group-hover:opacity-100 transition-opacity`}
            />

            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl font-bold text-gray-600 font-mono">
                {v.id}
              </span>
              <h2 className="text-lg font-semibold text-gray-200 group-hover:text-white transition-colors">
                {v.name}
              </h2>
            </div>
            <p className="text-sm text-gray-500">{v.description}</p>

            <div className="mt-4 text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
              Click to launch →
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
