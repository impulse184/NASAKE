
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, BarChartBig, BookOpen, 
  ClipboardCheck, User, Menu, X, 
  GamepadIcon, Sun, Moon
} from 'lucide-react';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: Home },
    { label: 'Journal', path: '/journal', icon: BookOpen },
    { label: 'Assessment', path: '/assessment', icon: ClipboardCheck },
    { label: 'Insights', path: '/insights', icon: BarChartBig },
    { label: 'Games', path: '/games', icon: GamepadIcon },
    { label: 'Profile', path: '/profile', icon: User },
  ];
  
  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="hidden md:flex nasake-gradient text-white font-display font-bold text-xl px-3 py-1 rounded-md">
              Nasake
            </div>
            <div className="md:hidden flex nasake-gradient text-white font-display font-bold text-xl h-8 w-8 items-center justify-center rounded-md">
              N
            </div>
          </Link>
        </div>
        
        <div className="hidden md:flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(item.path)
                  ? "bg-nasake-primary/10 text-nasake-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              Log Out
            </Button>
          </div>
        </div>
        
        <div className="md:hidden flex flex-1 items-center justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground mr-2"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-background z-50 p-4">
          <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  isActive(item.path)
                  ? "bg-nasake-primary/10 text-nasake-primary"
                  : "text-muted-foreground hover:bg-accent"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="flex justify-between items-center px-3 mt-4 pt-4 border-t">
              <span className="text-sm font-medium text-muted-foreground">Appearance</span>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 rounded-full"
                onClick={toggleTheme}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={16} />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon size={16} />
                    <span>Dark Mode</span>
                  </>
                )}
              </Button>
            </div>
            <Button 
              variant="ghost" 
              className="justify-start pl-3 mt-4 text-muted-foreground"
              onClick={signOut}
            >
              Log Out
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};
