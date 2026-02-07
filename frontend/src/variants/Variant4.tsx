import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { StatusBar } from '../components/StatusBar';

/** Threat Matrix — Dense information display */
export const Variant4: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f0a0a] text-gray-100">
      <div className="border-t-2 border-red-500/50" />
      <Navbar />
      <main className="flex-1 pb-10">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
};
