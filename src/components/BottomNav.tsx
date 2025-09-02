import React from 'react';
import { Link } from 'react-router-dom';

type NavItemProps = {
  to: string;
  icon: string;
  label: string;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => (
  <Link to={to} className="flex flex-col items-center justify-center p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
    <span className="text-xl">{icon}</span>
    <span className="text-xs">{label}</span>
  </Link>
);

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg flex justify-around py-2">
      <NavItem to="/" icon="🏠" label="Inicio" />
      <NavItem to="/frases" icon="🗣️" label="Frases" />
      <NavItem to="/progreso" icon="📈" label="Progreso" />
      {/* Añadir más elementos de navegación según sea necesario */}
    </nav>
  );
};

export default BottomNav;
