import React from 'react';
import { Link, useLocation } from 'react-router';
import { useAppStore } from '@/store/useAppStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import LanguageSelector from './LanguageSelector';
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  ChatBubbleBottomCenterTextIcon,
  MicrophoneIcon,
  Square2StackIcon,
  AcademicCapIcon,
  BookOpenIcon,
  PencilSquareIcon,
  ChartBarIcon,
  Squares2X2Icon,
  FaceSmileIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline';

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
  expanded: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, expanded }) => {
  const { closeSideNav } = useAppStore();
  const location = useLocation();
  const isActive = location.pathname === to;

  const handleClick = () => {
    window.speechSynthesis?.cancel();
    closeSideNav();
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      title={expanded ? undefined : label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center p-3 rounded-2xl transition-all mb-0.5 group ${expanded ? '' : 'justify-center'} ${isActive
        ? 'bg-accent text-on-accent shadow-lg shadow-accent/20 font-black'
        : 'text-tertiary hover:bg-surface/5 hover:text-primary'
        }`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${expanded ? 'mr-3' : ''} transition-transform group-hover:scale-110 ${isActive ? 'text-on-accent' : 'text-tertiary group-hover:text-accent'}`} />
      {expanded && <span className="text-xs uppercase tracking-widest font-semibold whitespace-nowrap">{label}</span>}
    </Link>
  );
};

const Section: React.FC<{ title: string; expanded: boolean; first?: boolean }> = ({ title, expanded, first }) =>
  expanded ? (
    <p className={`text-[10px] font-bold text-tertiary uppercase tracking-widest ${first ? 'mb-4' : 'mt-8 mb-4'} px-4`}>{title}</p>
  ) : (
    <div className={`${first ? 'mb-2' : 'mt-4 mb-2'} mx-3 border-t border-border/10`} aria-hidden="true" />
  );

/**
 * Layout:
 *  - <768px: drawer overlay w-72 (se abre desde TopNav), junto a BottomNav.
 *  - 768–1279px: rail w-20 fijo; el toggle abre el drawer expandido (w-72) como overlay.
 *  - ≥1280px: sidebar persistente w-20 / w-72 según isSideNavCollapsed (persistido).
 */
const SideNav: React.FC = () => {
  const { isSideNavOpen, closeSideNav, isSideNavCollapsed, toggleSideNavCollapsed } = useAppStore();
  const isDesktop = useMediaQuery('(min-width: 1280px)');
  const isTablet = useMediaQuery('(min-width: 768px)');

  const expanded = isDesktop ? !isSideNavCollapsed : isSideNavOpen;
  const showBackdrop = isSideNavOpen && !isDesktop;
  // Móvil: oculto salvo drawer abierto. Tablet/desktop: siempre visible.
  const visible = isTablet || isSideNavOpen;

  return (
    <>
      {showBackdrop && (
        <div
          data-testid="sidenav-backdrop"
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeSideNav}
        ></div>
      )}

      <aside
        data-testid="sidenav"
        inert={!visible}
        data-expanded={expanded}
        aria-label="Menú lateral"
        className={`fixed top-0 left-0 h-full ${expanded ? 'w-72' : 'w-20'} bg-background/95 backdrop-blur-2xl border-r border-border/10 transform ${visible ? 'translate-x-0' : '-translate-x-full'} transition-[width,transform] duration-300 ease-in-out z-50 flex flex-col overflow-hidden`}
      >
        <div className={`h-16 shrink-0 flex items-center ${expanded ? 'justify-between px-6' : 'justify-center'}`}>
          {expanded ? (
            <h2 className="text-xl font-black text-primary tracking-tighter whitespace-nowrap">
              Hostel<span className="text-accent">English</span>
            </h2>
          ) : (
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-primary font-black text-sm">H</div>
          )}
          {expanded && !isDesktop && (
            <button onClick={closeSideNav} aria-label="Cerrar menú" className="p-2 text-tertiary hover:text-primary transition-all">
              <XMarkIcon className="w-6 h-6" />
            </button>
          )}
        </div>

        <nav aria-label="Secciones de la aplicación" className="flex-grow overflow-y-auto overflow-x-hidden px-4 custom-scrollbar">
          <Section title="Menu Principal" expanded={expanded} first />
          <NavItem to="/" icon={HomeIcon} label="Inicio" expanded={expanded} />
          <NavItem to="/dashboard" icon={Squares2X2Icon} label="Dashboard" expanded={expanded} />

          <Section title="Aprendizaje" expanded={expanded} />
          <NavItem to="/frases" icon={ChatBubbleLeftRightIcon} label="Frases" expanded={expanded} />
          <NavItem to="/conversaciones" icon={ChatBubbleBottomCenterTextIcon} label="Diálogos" expanded={expanded} />
          <NavItem to="/dictado" icon={MicrophoneIcon} label="Dictado" expanded={expanded} />

          <Section title="Práctica" expanded={expanded} />
          <NavItem to="/flashcards" icon={Square2StackIcon} label="Flashcards" expanded={expanded} />
          <NavItem to="/roleplay" icon={FaceSmileIcon} label="Roleplay" expanded={expanded} />
          <NavItem to="/quiz" icon={AcademicCapIcon} label="Quiz" expanded={expanded} />

          <Section title="Evaluación" expanded={expanded} />
          <NavItem to="/estudio" icon={BookOpenIcon} label="Estudio" expanded={expanded} />
          <NavItem to="/examen" icon={PencilSquareIcon} label="Examen" expanded={expanded} />
          <NavItem to="/progreso" icon={ChartBarIcon} label="Mi Progreso" expanded={expanded} />

          <Section title="Preferencias" expanded={expanded} />
          <NavItem to="/configuracion" icon={Cog6ToothIcon} label="Ajustes" expanded={expanded} />
        </nav>

        {expanded && (
          <div className="p-4 border-t border-border/5 bg-background/10">
            <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-3 px-2">Idioma de Aprendizaje</p>
            <LanguageSelector />
          </div>
        )}

        {isDesktop && (
          <button
            onClick={toggleSideNavCollapsed}
            aria-label={isSideNavCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            className="m-3 p-3 flex items-center justify-center rounded-2xl text-tertiary hover:text-primary hover:bg-surface/5 transition-colors"
          >
            {isSideNavCollapsed ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
          </button>
        )}
      </aside>
    </>
  );
};

export default SideNav;
