import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const tabs = [
  { to: '/', icon: HomeIcon, label: 'Inicio' },
  { to: '/dashboard', icon: Squares2X2Icon, label: 'Módulos' },
  { to: '/frases', icon: ChatBubbleLeftRightIcon, label: 'Frases' },
  { to: '/quiz', icon: AcademicCapIcon, label: 'Quiz' },
  { to: '/progreso', icon: ChartBarIcon, label: 'Progreso' },
];

const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-primary-dark/95 backdrop-blur-xl border-t border-white/10 flex justify-around items-center py-2 z-50 sm:hidden safe-area-bottom"
      aria-label="Navegación principal"
      role="navigation"
    >
      {tabs.map(tab => {
        const isActive = location.pathname === tab.to;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center p-2 min-w-[48px] min-h-[44px] justify-center transition-all ${
              isActive
                ? 'text-accent scale-110'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={tab.label}
          >
            <tab.icon className={`w-5 h-5 transition-transform ${isActive ? 'drop-shadow-[0_0_6px_rgba(230,126,34,0.5)]' : ''}`} />
            <span className={`text-[9px] mt-1 uppercase tracking-wider transition-colors ${isActive ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
