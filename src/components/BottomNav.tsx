import React from 'react';
import { Link } from 'react-router-dom';

type NavItemProps = {
  to: string;
  icon: string;
  label: string;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon, label }) => {
  const handleClick = () => {
    window.speechSynthesis.cancel(); // Detiene cualquier reproducción de voz al navegar
  };
  return (
    <Link to={to} onClick={handleClick} className="flex flex-col items-center justify-center p-2 text-gray-300 hover:text-accent">
      <span className="text-xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </Link>
  );
};

const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-primary-dark border-t border-primary shadow-lg flex justify-around py-2">
      <NavItem to="/" icon="🏠" label="Inicio" />
      <NavItem to="/frases" icon="🗣️" label="Frases" />
      <NavItem to="/conversaciones" icon="💬" label="Conversaciones" />
      <NavItem to="/flashcards" icon="🧠" label="Flashcards" />
      <NavItem to="/quiz" icon="❓" label="Quiz" />
      <NavItem to="/estudio" icon="📚" label="Estudio" />
      <NavItem to="/examen" icon="📝" label="Examen" />
      <NavItem to="/progreso" icon="📈" label="Progreso" />
      <NavItem to="/dashboard" icon="📊" label="Dashboard" />
    </nav>
  );
};

export default BottomNav;
