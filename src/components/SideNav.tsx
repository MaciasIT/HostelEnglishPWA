import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
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
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

type NavItemProps = {
  to: string;
  icon: React.ElementType;
  label: string;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => {
  const { closeSideNav } = useAppStore();
  const location = useLocation();
  const isActive = location.pathname === to;

  const handleClick = () => {
    window.speechSynthesis.cancel();
    closeSideNav();
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={`flex items-center p-3 rounded-2xl transition-all mb-0.5 group ${isActive
        ? 'bg-accent text-white shadow-lg shadow-accent/20 font-black'
        : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`}
    >
      <Icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-accent'}`} />
      <span className="text-xs uppercase tracking-widest">{label}</span>
    </Link>
  );
};

const SideNav: React.FC = () => {
  const { isSideNavOpen, closeSideNav } = useAppStore();

  return (
    <>
      {/* Backdrop */}
      {isSideNavOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeSideNav}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 lg:w-64 bg-primary-dark/95 backdrop-blur-2xl border-r border-white/10 transform ${isSideNavOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-500 ease-in-out z-50 flex flex-col`}>
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-tighter">
            Hostel<span className="text-accent">English</span>
          </h2>
          <button
            onClick={closeSideNav}
            className="p-2 text-gray-500 hover:text-white transition-all"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-grow overflow-y-auto px-4 custom-scrollbar">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4 px-4">Menu Principal</p>
          <NavItem to="/" icon={HomeIcon} label="Inicio" />
          <NavItem to="/dashboard" icon={Squares2X2Icon} label="Dashboard" />

          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-8 mb-4 px-4">Aprendizaje</p>
          <NavItem to="/frases" icon={ChatBubbleLeftRightIcon} label="Frases" />
          <NavItem to="/conversaciones" icon={ChatBubbleBottomCenterTextIcon} label="Diálogos" />
          <NavItem to="/dictado" icon={MicrophoneIcon} label="Dictado" />

          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-8 mb-4 px-4">Práctica</p>
          <NavItem to="/flashcards" icon={Square2StackIcon} label="Flashcards" />
          <NavItem to="/quiz" icon={AcademicCapIcon} label="Quiz" />

          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-8 mb-4 px-4">Evaluación</p>
          <NavItem to="/estudio" icon={BookOpenIcon} label="Estudio" />
          <NavItem to="/examen" icon={PencilSquareIcon} label="Examen" />
          <NavItem to="/progreso" icon={ChartBarIcon} label="Mi Progreso" />

          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mt-8 mb-4 px-4">Preferencias</p>
          <NavItem to="/configuracion" icon={Cog6ToothIcon} label="Ajustes" />
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/10">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-3 px-2">Idioma de Aprendizaje</p>
          <LanguageSelector />
        </div>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-black shadow-lg text-xs">
              H
            </div>
            <div>
              <p className="text-[10px] font-black text-white">Versión 2.1</p>
              <p className="text-[8px] text-gray-500 italic">HostelEnglish MultiLang</p>
            </div>
          </div>
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
      `}} />
    </>
  );
};

export default SideNav;
