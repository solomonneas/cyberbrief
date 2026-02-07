import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { StatusBar } from './StatusBar';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <Navbar />
      <main className="flex-1 pb-10">
        <Outlet />
      </main>
      <StatusBar />
    </div>
  );
};
