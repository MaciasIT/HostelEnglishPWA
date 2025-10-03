import React from 'react';
import { useAppStore } from '@/store/useAppStore';

const TopNav: React.FC = () => {
  const { toggleSideNav } = useAppStore();

  return (
    <nav className="fixed top-0 left-0 right-0 bg-primary-dark border-b border-primary shadow-lg flex items-center justify-between px-4 py-2 z-20">
      <button onClick={toggleSideNav} className="text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 className="text-xl font-bold text-white">Hostellinglés</h1>
      <div className="w-6"></div> {/* Spacer */}
    </nav>
  );
};

export default TopNav;
