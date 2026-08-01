import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLenis } from '../hooks/useLenis';
import { Navbar } from '../components/landing/Navbar';
import { Footer } from '../components/landing/Footer';

export const MainLayout = ({ children }) => {
  useLenis(); // enable smooth Lenis scroll

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white selection:bg-white selection:text-black overflow-x-hidden relative">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          {children || <Outlet />}
        </main>
        <Footer />
      </div>
    </div>
  );
};
