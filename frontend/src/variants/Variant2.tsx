import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { StatusBar } from '../components/StatusBar';

/** Neon Grid — Cyberpunk aesthetic with neon accents */
export const Variant2: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d1a] text-gray-100">
      <div className="border-t-2 border-purple-500/50" />
      <Navbar />
      <main className="flex-1 pb-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
};
