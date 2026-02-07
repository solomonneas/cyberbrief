import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { StatusBar } from '../components/StatusBar';

/** Command Center — Military-inspired dark theme with structured panels */
export const Variant1: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a12] text-gray-100">
      <div className="border-t-2 border-cyan-500/50" />
      <Navbar />
      <main className="flex-1 pb-10">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
};
