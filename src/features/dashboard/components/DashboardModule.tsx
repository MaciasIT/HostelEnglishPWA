import React from 'react';
import { Link } from 'react-router-dom';

interface DashboardModuleProps {
  title: string;
  path: string;
  icon: React.ElementType;
  color: string;
  desc: string;
  index: number;
}

export default function DashboardModule({ title, path, icon: Icon, color, desc, index }: DashboardModuleProps) {
  return (
    <Link
      to={path}
      className="group bg-white/5 hover:bg-white/10 p-6 sm:p-8 rounded-[2.5rem] border border-white/10 transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms` }}
      aria-label={`Ir al módulo de ${title}: ${desc}`}
    >
      <div className={`${color} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-xl group-hover:rotate-6 transition-transform`}>
        <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>
      <h3 className="text-lg sm:text-xl font-black text-white mb-2 tracking-tight group-hover:text-accent transition-colors">{title}</h3>
      <p className="text-gray-400 text-xs sm:text-sm font-medium leading-relaxed">{desc}</p>
    </Link>
  );
}
