import React from 'react';
import { Link } from 'react-router';
import { useAppStore } from '@/store/useAppStore';
import ThemeToggle from '@/components/ThemeToggle';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Bars3Icon, UserCircleIcon, WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';

const TopNav: React.FC = () => {
  const { toggleSideNav, isSideNavCollapsed } = useAppStore();
  const online = useOnlineStatus();

  // Tablet: rail w-20. Desktop (≥1280px): sidebar persistente w-20 / w-72.
  const offset = isSideNavCollapsed ? 'md:left-20' : 'md:left-20 xl:left-72';

  return (
    <header
      className={`fixed top-0 left-0 right-0 ${offset} bg-background/80 backdrop-blur-xl border-b border-border/5 shadow-2xl flex items-center justify-between px-4 sm:px-6 h-16 z-[45] transition-[left] duration-300 ease-in-out`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSideNav}
          aria-label="Abrir menú"
          className="xl:hidden p-2 bg-surface/5 border border-border/10 rounded-xl text-primary hover:bg-accent transition-colors active:scale-95"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-primary tracking-tighter">
          Hostel<span className="text-accent">English</span>
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span
          role="status"
          aria-label={online ? 'En línea' : 'Sin conexión'}
          title={online ? 'En línea' : 'Sin conexión'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${online ? 'text-green-500 border-green-500/30' : 'text-amber-500 border-amber-500/30'}`}
        >
          {online ? <WifiIcon className="w-4 h-4" /> : <SignalSlashIcon className="w-4 h-4" />}
          <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
        </span>
        <ThemeToggle />
        <Link
          to="/configuracion"
          aria-label="Perfil y ajustes"
          className="p-1.5 rounded-full text-primary hover:text-accent hover:bg-surface/5 transition-colors"
        >
          <UserCircleIcon className="w-8 h-8" />
        </Link>
      </div>
    </header>
  );
};

export default TopNav;
