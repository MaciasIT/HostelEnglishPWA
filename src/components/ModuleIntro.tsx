import React from 'react';

interface ModuleIntroProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onStart: () => void;
    color?: string;
    stats?: { label: string; value: string | number }[];
}

const ModuleIntro: React.FC<ModuleIntroProps> = ({
    title,
    description,
    icon: Icon,
    onStart,
    color = 'bg-accent',
    stats
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-8 animate-fade-in">
            <div className={`${color} p-6 rounded-3xl shadow-2xl mb-8 transform hover:scale-110 transition-transform duration-500`}>
                <Icon className="w-16 h-16 text-white" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
                {title}
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mb-12 leading-relaxed">
                {description}
            </p>

            {stats && stats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12 w-full max-w-lg">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={onStart}
                className={`${color} hover:brightness-110 text-white font-bold py-4 px-12 rounded-2xl text-xl shadow-xl transform active:scale-95 transition-all duration-200 flex items-center gap-3`}
            >
                Empezar Ahora
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </button>

            <div className="mt-12 flex gap-8">
                <div className="flex flex-col items-center opacity-50">
                    <div className="w-2 h-2 rounded-full bg-white mb-2 pulse-slow"></div>
                    <span className="text-xs uppercase tracking-tighter">Interactivo</span>
                </div>
                <div className="flex flex-col items-center opacity-50">
                    <div className="w-2 h-2 rounded-full bg-white mb-2 pulse-slow animation-delay-500"></div>
                    <span className="text-xs uppercase tracking-tighter">Voces Reales</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .pulse-slow {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .3; transform: scale(1.5); }
        }
        .animation-delay-500 {
          animation-delay: 500ms;
        }
      `}} />
        </div>
    );
};

export default ModuleIntro;
