import React from 'react';
import { StarIcon } from '@heroicons/react/24/outline';

interface AchievementBadgeProps {
  title: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  isUnlocked: boolean;
}

export default function AchievementBadge({ title, desc, icon: Icon, color, isUnlocked }: AchievementBadgeProps) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        isUnlocked 
          ? 'bg-white/10 border-white/10 shadow-lg' 
          : 'bg-black/20 border-white/5 opacity-40 grayscale'
      }`}
      role="listitem"
      aria-label={`${title}: ${isUnlocked ? 'Desbloqueado' : 'Bloqueado'}. ${desc}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${color} shadow-lg shadow-black/20`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-white uppercase tracking-tight">
          {title}
        </h4>
        <p className="text-[10px] text-gray-400 font-medium">
          {desc}
        </p>
      </div>
      {isUnlocked && (
        <div className="ml-auto">
          <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
