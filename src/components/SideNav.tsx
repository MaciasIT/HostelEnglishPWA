import React from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

type NavItemProps = {
  to: string;
  icon: string;
  label: string;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const { closeSideNav } = useAppStore();

  const handleClick = () => {
    window.speechSynthesis.cancel();
    closeSideNav();
  };

  return (
    <Link to={to} onClick={handleClick} className="flex items-center p-4 text-gray-300 hover:text-accent hover:bg-primary-dark">
      <span className="text-xl mr-4">{icon}</span>
      <span className="text-lg">{label}</span>
    </Link>
  );
};

const SideNav: React.FC = () => {
  const { isSideNavOpen, closeSideNav } = useAppStore();

  return (
    <>
      {isSideNavOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30" onClick={closeSideNav}></div>
      )}
      <aside className={`fixed top-0 left-0 h-full bg-primary-dark w-64 transform ${isSideNavOpen ? 'translateX(0)' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-40`}>
        <div className="p-4">
          <h2 className="text-2xl font-bold text-white mb-4">Menú</h2>
          <nav className="flex flex-col">
            <NavItem to="/" icon="🏠" label="Inicio" />
            <NavItem to="/frases" icon="🗣️" label="Frases" />
            <NavItem to="/conversaciones" icon="💬" label="Conversaciones" />
            <NavItem to="/dictado" icon="✍️" label="Dictado" />
            <NavItem to="/flashcards" icon="🧠" label="Flashcards" />
            <NavItem to="/quiz" icon="❓" label="Quiz" />
            <NavItem to="/estudio" icon="📚" label="Estudio" />
            <NavItem to="/examen" icon="📝" label="Examen" />
            <NavItem to="/progreso" icon="📈" label="Progreso" />
            <NavItem to="/dashboard" icon="📊" label="Dashboard" />
          </nav>
        </div>
      </aside>
    </>
  );
};

export default SideNav;
