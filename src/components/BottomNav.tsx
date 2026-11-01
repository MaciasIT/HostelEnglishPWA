import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import { haptics } from '../utils/haptics';
import {
  HomeIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export const bottomNavTabs = [
  { to: '/', icon: HomeIcon, label: 'Inicio' },
  { to: '/dashboard', icon: Squares2X2Icon, label: 'Módulos' },
  { to: '/frases', icon: ChatBubbleLeftRightIcon, label: 'Frases' },
  { to: '/quiz', icon: AcademicCapIcon, label: 'Quiz' },
  { to: '/progreso', icon: ChartBarIcon, label: 'Progreso' },
];

const SCROLL_THRESHOLD = 8;

/** Oculta al bajar, reaparece al subir (siempre visible cerca del top). */
function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      if (y < 64) setHidden(false);
      else if (delta > SCROLL_THRESHOLD) setHidden(true);
      else if (delta < -SCROLL_THRESHOLD) setHidden(false);
      if (Math.abs(delta) > SCROLL_THRESHOLD) lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return hidden;
}

const BottomNav: React.FC = () => {
  const location = useLocation();
  const hidden = useHideOnScroll();

  return (
    <motion.nav
      data-testid="bottom-nav"
      data-hidden={hidden}
      initial={false}
      animate={{ y: hidden ? '100%' : 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 36 }}
      className="fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-t border-border/10 z-40 md:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
      role="navigation"
    >
      <div className="flex justify-around items-center h-16 px-2">
        {bottomNavTabs.map(tab => {
          const isActive = location.pathname === tab.to;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={`relative flex flex-col items-center justify-center min-w-14 min-h-14 flex-1 max-w-24 rounded-2xl transition-colors active:scale-95 ${
                isActive ? 'text-accent' : 'text-tertiary hover:text-secondary'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              onClick={() => { if (!isActive) haptics.trigger('SELECTION'); }}
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  data-testid="bottom-nav-indicator"
                  className="absolute inset-x-1 inset-y-1 rounded-2xl bg-accent/15 ring-1 ring-accent/20"
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                />
              )}
              <tab.icon aria-hidden="true" className="relative w-6 h-6" />
              <span className={`relative text-[10px] mt-0.5 uppercase tracking-wider ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
