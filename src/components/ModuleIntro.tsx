import React from 'react';
import { motion } from 'framer-motion';

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
            <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={`${color} p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] mb-10 transform hover:scale-110 transition-transform duration-500 border border-white/20`}
            >
                <Icon className="w-20 h-20 text-white drop-shadow-2xl" />
            </motion.div>

            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tighter">
                {title}
            </h1>

            <p className="text-xl sm:text-2xl text-gray-400 max-w-2xl mb-14 leading-[1.3] font-medium italic">
                {description}
            </p>

            {stats && stats.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-14 w-full max-w-xl">
                    {stats.map((stat, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-xl"
                        >
                            <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                            <div className="text-[10px] text-accent font-black uppercase tracking-[0.2em]">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            )}

            <motion.button
                whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onStart}
                className={`${color} text-white font-black py-5 px-14 rounded-[2rem] text-2xl shadow-[0_20px_40px_-10px_rgba(230,126,34,0.5)] flex items-center gap-4 uppercase tracking-widest`}
            >
                Empezar Ahora
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
            </motion.button>

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
        </div>
    );
};

export default ModuleIntro;
