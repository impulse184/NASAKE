
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Navigation } from './Navigation';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {!isLandingPage && <Navigation />}
      <main className="flex-1">
        {children}
      </main>
      <Toaster />
      <Sonner />
      <footer className="py-4 px-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Nasake. All rights reserved.</p>
      </footer>
    </div>
  );
};
