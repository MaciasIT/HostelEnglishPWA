import React from 'react';
import { Link } from 'react-router';
import { useProgressLogic } from '@/features/progress/hooks/useProgressLogic';
import AchievementBadge from '@/features/progress/components/AchievementBadge';
import PageContainer from '@/components/layout/PageContainer';
import CertificationBadge from '@/components/CertificationBadge';
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

const Progreso: React.FC = () => {
  const { state } = useProgressLogic();

  return (
    <PageContainer title="Mi Progreso y Logros">
      <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-fade-in">

        {/* Top Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Resumen de estadísticas">
          <StatCard
            icon={ChartBarIcon}
            label="Total Frases"
            value={state.stats.total}
            color="bg-info"
            delay={0}
          />
          <StatCard
            icon={AcademicCapIcon}
            label="En Estudio"
            value={state.stats.studied}
            color="bg-yellow-500"
            delay={0.1}
          />
          <StatCard
            icon={CheckBadgeIcon}
            label="Aprendidas"
            value={state.stats.learned}
            color="bg-success"
            delay={0.2}
          />
          <StatCard
            icon={FireIcon}
            label="Dominio Global"
            value={`${state.stats.progressPercent}%`}
            color="bg-orange-500"
            delay={0.3}
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Daily Evolution Chart */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-surface/5 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-border/10 backdrop-blur-md shadow-2xl relative overflow-hidden"
            aria-labelledby="evolution-heading"
          >
            <div className="flex justify-between items-center mb-6 sm:mb-10">
              <div>
                <h2 id="evolution-heading" className="text-xl sm:text-2xl font-black text-primary tracking-tight">Evolución Semanal</h2>
                <p className="text-tertiary text-xs sm:text-sm font-medium">Frases practicadas por día</p>
              </div>
              <div className="bg-accent/20 px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-accent-text text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]" aria-hidden="true">
                Tendencia
              </div>
            </div>

            {/* Accessible Table for Screen Readers */}
            <table className="sr-only">
              <caption>Frases practicadas en los últimos 7 días</caption>
              <thead>
                <tr><th>Fecha</th><th>Frases</th></tr>
              </thead>
              <tbody>
                {state.chartData.map(d => (
                  <tr key={d.rawDate}><td>{d.date}</td><td>{d.count}</td></tr>
                ))}
              </tbody>
            </table>

            <div className="h-[320px] w-full" role="img" aria-label="Gráfico de área mostrando la evolución diaria de frases practicadas. Ver tabla accesible para detalles.">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={state.chartData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 'bold' }}
                    dy={12}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#3b82f6' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={5}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    animationDuration={2500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Achievements Sidebar */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface/5 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-border/10 backdrop-blur-md shadow-xl"
            aria-labelledby="achievements-heading"
          >
            <h2 id="achievements-heading" className="text-xl sm:text-2xl font-black text-primary mb-6 sm:mb-8 flex items-center gap-3">
              <TrophyIcon className="w-7 h-7 sm:w-8 sm:h-8 text-warning-text drop-shadow-lg" />
              Medallas
            </h2>

            <div className="space-y-4 sm:space-y-5" role="list">
              {Object.entries(ACHIEVEMENT_METADATA).map(([key, meta]) => (
                <AchievementBadge
                  key={key}
                  {...meta}
                  isUnlocked={state.achievements.includes(key)}
                />
              ))}

              {state.achievements.length === 0 && (
                <div className="py-8 sm:py-12 text-center bg-surface/5 rounded-2xl sm:rounded-3xl border border-dashed border-border/5 shadow-inner" role="status">
                  <p className="text-xs sm:text-sm text-tertiary font-semibold uppercase tracking-widest px-4">
                    Completa exámenes para ganar medallas
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* Category Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/5 p-4 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-border/10 shadow-2xl"
            aria-labelledby="categories-heading"
          >
            <div className="flex items-center gap-3 mb-6 sm:mb-10">
              <span className="w-2.5 sm:w-3 h-6 sm:h-8 bg-accent rounded-full" aria-hidden="true"></span>
              <h2 id="categories-heading" className="text-xl sm:text-2xl font-black text-primary tracking-tight">Dominio por Categoría</h2>
            </div>

            <div className="h-[280px]" role="img" aria-label="Gráfico de barras mostrando el porcentaje de aprendizaje por categoría.">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={state.categoryChartData} layout="vertical" margin={{ left: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#fff', fontSize: 11, fontWeight: '800', width: 120 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }}
                  />
                  <Bar dataKey="percent" radius={[0, 12, 12, 0]} barSize={24}>
                    {state.categoryChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(var(--accent-hsl), ${100 - (index * 12)}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* Motivational Card */}
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-accent/20 to-blue-600/20 p-10 rounded-[3.5rem] border border-border/10 flex flex-col justify-center items-center text-center backdrop-blur-md relative overflow-hidden group shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700" aria-hidden="true">
              <SparklesIcon className="w-48 h-48 text-primary" />
            </div>

            <div className="w-24 h-24 bg-surface/10 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl border border-border/20 rotate-3 group-hover:rotate-0 transition-transform">
              <AcademicCapIcon className="w-12 h-12 text-primary" />
            </div>
            
            <h2 className="text-3xl font-black text-primary mb-4">¡Vas por buen camino!</h2>
            <p className="text-secondary mb-10 max-w-sm text-lg font-medium leading-relaxed">
              Has dominado el <span className="text-accent-text font-black text-2xl">{state.stats.progressPercent}%</span> del curso. Sigue así y pronto serás bilingüe en el sector hostelero.
            </p>
            
            <Link 
              to="/frases"
              className="bg-surface text-primary px-12 py-5 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-accent hover:text-primary transition-all shadow-2xl active:scale-95 z-10"
            >
              Continuar Practicando
            </Link>
          </motion.section>
        </div>

        {/* Certifications History */}
        {state.certifications.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface/5 p-4 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-border/10 shadow-2xl"
            aria-labelledby="certifications-heading"
          >
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <span className="w-2.5 sm:w-3 h-6 sm:h-8 bg-yellow-500 rounded-full" aria-hidden="true"></span>
              <h2 id="certifications-heading" className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                Certificaciones Laborales
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {state.certifications.slice().reverse().map(cert => (
                <CertificationBadge key={cert.id} certification={cert} compact />
              ))}
            </div>
          </motion.section>
        )}


      </div>
    </PageContainer>
  );
};

function StatCard({ icon: Icon, label, value, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="bg-surface/5 p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-border/10 backdrop-blur-sm hover:bg-surface/10 transition-all group flex flex-col items-center text-center shadow-lg"
    >
      <div className={`${color} w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[1.5rem] flex items-center justify-center text-primary mb-3 sm:mb-6 shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>
        <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
      </div>
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-tertiary font-semibold mb-1 sm:mb-2">{label}</p>
      <p className="text-3xl sm:text-4xl font-black text-primary tracking-tight">{value}</p>
    </motion.div>
  );
}

export default Progreso;
