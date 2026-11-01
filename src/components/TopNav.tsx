import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Bars3Icon } from '@heroicons/react/24/outline';

const TopNav: React.FC = () => {
  const { toggleSideNav } = useAppStore();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-border/5 shadow-2xl flex items-center justify-between px-6 py-4 z-[45]">
      <button
        onClick={toggleSideNav}
        className="p-2 bg-surface/5 border border-border/10 rounded-xl text-primary hover:bg-accent transition-colors active:scale-95"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      <h1 className="text-xl font-black text-primary tracking-tighter">
        Hostel<span className="text-accent">English</span>
      </h1>

      <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center text-accent text-xs font-black border border-accent/20">
        HE
      </div>
    </nav>
  );
};

export default TopNav;
