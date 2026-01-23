import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import {
  ChartBarIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  FireIcon
} from '@heroicons/react/24/outline';

export default function Progreso() {
  const { frases, progress, categories } = useAppStore();

  const stats = useMemo(() => {
    const total = frases.length;
    const studied = Object.values(progress).filter(v => v === 1).length;
    const learned = Object.values(progress).filter(v => v === 2).length;
    const pending = total - studied - learned;

    const progressPercent = total > 0 ? Math.round(((studied + learned * 2) / (total * 2)) * 100) : 0;

    return { total, studied, learned, pending, progressPercent };
  }, [frases, progress]);

  // Group phrases by category for more detailed stats
  const categoryStats = useMemo(() => {
    const data: Record<string, { total: number, learned: number }> = {};

    frases.forEach(phrase => {
      if (phrase.categoria) {
        if (!data[phrase.categoria]) data[phrase.categoria] = { total: 0, learned: 0 };
        data[phrase.categoria].total++;
        if (progress[phrase.id] === 2) data[phrase.categoria].learned++;
      }
    });

    return Object.entries(data).sort((a, b) => b[1].total - a[1].total);
  }, [frases, progress]);

  return (
    <PageContainer title="Mi Progreso">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ChartBarIcon}
            label="Total Frases"
            value={stats.total}
            color="bg-blue-500"
          />
          <StatCard
            icon={AcademicCapIcon}
            label="En Estudio"
            value={stats.studied}
            color="bg-yellow-500"
          />
          <StatCard
            icon={CheckBadgeIcon}
            label="Aprendidas"
            value={stats.learned}
            color="bg-green-500"
          />
          <StatCard
            icon={FireIcon}
            label="Prestigio"
            value={`${stats.progressPercent}%`}
            color="bg-orange-500"
          />
        </div>

        {/* Global Progress Bar */}
        <div className="bg-white/10 p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="text-2xl font-black text-white">Progreso General</h3>
              <p className="text-gray-400 text-sm">Basado en el nivel de aprendizaje de todas las frases</p>
            </div>
            <span className="text-4xl font-black text-accent">{stats.progressPercent}%</span>
          </div>
          <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-accent to-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `${stats.progressPercent}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-[10px] uppercase tracking-widest font-bold text-center">
            <div className="text-gray-500">Nuevas: {stats.pending}</div>
            <div className="text-yellow-500">Estudiadas: {stats.studied}</div>
            <div className="text-green-500">Aprendidas: {stats.learned}</div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
            <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-accent rounded-full"></span>
              Por Categoría
            </h3>
            <div className="space-y-6">
              {categoryStats.slice(0, 6).map(([name, data]) => {
                const percent = Math.round((data.learned / data.total) * 100);
                return (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white font-medium">{name}</span>
                      <span className="text-gray-400">{data.learned}/{data.total}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent opacity-80"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mb-6">
              <AcademicCapIcon className="w-12 h-12 text-accent" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">¡Sigue Así!</h3>
            <p className="text-gray-400 mb-8 max-w-xs">
              Has completado el <span className="text-white font-bold">{stats.progressPercent}%</span> del curso.
              Sigue practicando diariamente para dominar el inglés hostelero.
            </p>
            <button className="bg-white text-primary px-8 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95">
              Continuar Estudiando
            </button>
          </div>
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
      `}} />
    </PageContainer>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}
