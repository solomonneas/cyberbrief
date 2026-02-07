import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { StatusBar } from '../components/StatusBar';

/** Analyst Desktop — Multi-panel SIEM-inspired layout */
export const Variant5: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0a] text-gray-100">
      <div className="border-t-2 border-amber-500/50" />
      <Navbar />
      <main className="flex-1 pb-10">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
};
