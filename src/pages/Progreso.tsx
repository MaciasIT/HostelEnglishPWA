import React, { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import {
  ChartBarIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';

const ACHIEVEMENT_METADATA: Record<string, { title: string, desc: string, icon: any, color: string }> = {
  'first_exam': {
    title: 'Primer Paso',
    desc: 'Completaste tu primer examen oficial.',
    icon: StarIcon,
    color: 'from-blue-400 to-blue-600'
  },
  'perfect_score': {
    title: 'Excelencia',
    desc: '¡Puntuación perfecta! 100% de aciertos.',
    icon: SparklesIcon,
    color: 'from-amber-400 to-orange-500'
  },
  'exam_master': {
    title: 'Maestro de Exámenes',
    desc: 'Superaste 5 exámenes con nota excelente.',
    icon: TrophyIcon,
    color: 'from-purple-500 to-pink-600'
  }
};

export default function Progreso() {
  const { frases, progress, dailyActivity, achievements } = useAppStore();
  const targetLanguage = useAppStore(state => state.prefs.targetLanguage);

  const stats = useMemo(() => {
    const total = frases.length;
    const studied = Object.values(progress).filter(v => v === 1).length;
    const learned = Object.values(progress).filter(v => v === 2).length;
    const pending = total - studied - learned;
    const progressPercent = total > 0 ? Math.round(((studied + learned * 2) / (total * 2)) * 100) : 0;

    return { total, studied, learned, pending, progressPercent };
  }, [frases, progress]);

  // Data for Daily Activity Chart
  const chartData = useMemo(() => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => ({
      date: date.split('-').slice(1).reverse().join('/'), // format DD/MM
      count: dailyActivity[date] || 0
    }));
  }, [dailyActivity]);

  // Data for Categories Chart
  const categoryChartData = useMemo(() => {
    const data: Record<string, { total: number, learned: number }> = {};
    frases.forEach(phrase => {
      if (phrase.categoria) {
        if (!data[phrase.categoria]) data[phrase.categoria] = { total: 0, learned: 0 };
        data[phrase.categoria].total++;
        if (progress[phrase.id] === 2) data[phrase.categoria].learned++;
      }
    });

    return Object.entries(data)
      .map(([name, d]) => ({
        name,
        percent: Math.round((d.learned / d.total) * 100),
        learned: d.learned,
        total: d.total
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  }, [frases, progress]);

  return (
    <PageContainer title="Mi Progreso">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={ChartBarIcon}
            label="Total Frases"
            value={stats.total}
            color="bg-blue-500"
            delay={0}
          />
          <StatCard
            icon={AcademicCapIcon}
            label="En Estudio"
            value={stats.studied}
            color="bg-yellow-500"
            delay={0.1}
          />
          <StatCard
            icon={CheckBadgeIcon}
            label="Aprendidas"
            value={stats.learned}
            color="bg-green-500"
            delay={0.2}
          />
          <StatCard
            icon={FireIcon}
            label="Prestigio"
            value={`${stats.progressPercent}%`}
            color="bg-orange-500"
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Evolution Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md shadow-2xl"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-white">Evolución Diaria</h3>
                <p className="text-gray-500 text-sm">Actividad en los últimos 7 días</p>
              </div>
              <div className="bg-accent/20 px-4 py-1 rounded-full text-accent text-xs font-bold uppercase tracking-widest">
                En Vivo
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Gamification / Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 backdrop-blur-md"
          >
            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <TrophyIcon className="w-6 h-6 text-yellow-500" />
              Insignias y Logros
            </h3>

            <div className="space-y-4">
              {Object.entries(ACHIEVEMENT_METADATA).map(([key, meta]) => {
                const isUnlocked = achievements.includes(key);
                const Icon = meta.icon;
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isUnlocked ? 'bg-white/10 border-white/10' : 'bg-black/20 border-white/5 opacity-40 grayscale'
                      }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.color} shadow-lg shadow-black/20`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-tight">
                        {meta.title}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        {meta.desc}
                      </p>
                    </div>
                    {isUnlocked && (
                      <div className="ml-auto">
                        <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      </div>
                    )}
                  </div>
                );
              })}

              {achievements.length === 0 && (
                <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                  <p className="text-xs text-gray-500 font-medium">
                    Completa exámenes para desbloquear logros
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: Category Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10"
          >
            <h3 className="text-xl font-bold mb-8 text-white flex items-center gap-2">
              <span className="w-2 h-6 bg-accent rounded-full"></span>
              Top Categorías
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '12px' }}
                  />
                  <Bar dataKey="percent" radius={[0, 10, 10, 0]} barSize={20}>
                    {categoryChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--accent-hsl), ${100 - (index * 15)}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-accent/20 to-blue-500/20 p-8 rounded-[2.5rem] border border-white/10 flex flex-col justify-center items-center text-center backdrop-blur-sm relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <SparklesIcon className="w-32 h-32 text-white" />
            </div>

            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-2xl border border-white/20">
              <AcademicCapIcon className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">
              ¡Sigue Así!
            </h3>
            <p className="text-gray-400 mb-8 max-w-xs text-sm">
              Has completado el <span className="text-white font-bold">{stats.progressPercent}%</span> del curso de {targetLanguage === 'eu' ? 'euskera' : 'inglés'}. Sigue practicando diariamente para dominar el idioma.
            </p>
            <button className="bg-white text-primary px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-2xl active:scale-95 z-10">
              Continuar Estudiando
            </button>
          </motion.div>
        </div>

      </div>
    </PageContainer>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group cursor-default"
    >
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </motion.div>
  );
}
