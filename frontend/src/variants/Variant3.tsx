import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { StatusBar } from '../components/StatusBar';

/** Clean Intel — Minimalist design focused on readability */
export const Variant3: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <div className="border-t-2 border-emerald-500/50" />
      <Navbar />
      <main className="flex-1 pb-10">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
};
