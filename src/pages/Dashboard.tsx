import React, { useMemo } from 'react';
import { Link } from 'react-router';
import { useAppStore } from '@/store/useAppStore';
import { ROLE_LABELS, filterByRole } from '@/utils/roleFilter';
import { useDashboardLogic } from '@/features/dashboard/hooks/useDashboardLogic';
import DashboardModule from '@/features/dashboard/components/DashboardModule';
import DailyChallengeCard from '@/features/dashboard/components/DailyChallengeCard';
import PageContainer from '@/components/layout/PageContainer';
import {
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  FaceSmileIcon,
  MapIcon,
  MicrophoneIcon,
  Square2StackIcon,
  ChartBarIcon,
  BookmarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { stats, targetLanguage } = useDashboardLogic();
  const selectedRole = useAppStore((s) => s.prefs.selectedRole);
  const frases = useAppStore((s) => s.frases);
  const roleLabel = selectedRole ? ROLE_LABELS[selectedRole] : null;
  const roleFrasesCount = useMemo(
    () => filterByRole(frases, selectedRole).length,
    [frases, selectedRole]
  );
  const personalized = !!selectedRole && selectedRole !== 'general';

  const modules = [
    {
      title: 'Frases',
      path: '/frases',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-cyan-400',
      desc: personalized ? `Frases de ${roleLabel}` : 'Esenciales del día a día'
    },
    {
      title: 'Diálogos',
      path: '/conversaciones',
      icon: MapIcon,
      color: 'bg-accent',
      desc: 'Simulaciones reales'
    },
    {
      title: 'Roleplay',
      path: '/roleplay',
      icon: FaceSmileIcon,
      color: 'bg-accent-hover',
      desc: 'IA como cliente real'
    },
    {
      title: 'Dictado',
      path: '/dictado',
      icon: MicrophoneIcon,
      color: 'bg-cyan-400',
      desc: 'Entrena tu oído'
    },
    {
      title: 'Flashcards',
      path: '/flashcards',
      icon: Square2StackIcon,
      color: 'bg-accent',
      desc: 'Memorización rápida'
    },
    {
      title: 'Quiz',
      path: '/quiz',
      icon: AcademicCapIcon,
      color: 'bg-cyan-400',
      desc: '¡Ponte a prueba!'
    },
    {
      title: 'Progreso',
      path: '/progreso',
      icon: ChartBarIcon,
      color: 'bg-accent-hover',
      desc: 'Mira tus logros'
    },
  ];

  return (
    <PageContainer title="Dashboard de Usuario">
      <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-fade-in">

        {/* Welcome Section */}
        <section 
          className="bg-gradient-to-br from-primary-light to-primary-dark p-5 sm:p-8 lg:p-12 rounded-2xl sm:rounded-[2.5rem] lg:rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-border/10"
          aria-labelledby="welcome-heading"
        >
          <div className="relative z-10">
            <h1 id="welcome-heading" className="text-2xl sm:text-4xl lg:text-5xl font-black text-primary mb-3 sm:mb-6 tracking-tight">
              ¡Hola de nuevo! 🏨
            </h1>
            <p className="text-base sm:text-xl lg:text-2xl text-secondary mb-6 sm:mb-10 max-w-2xl font-medium leading-relaxed">
              Continúa tu formación en <span className="text-accent font-black uppercase text-base sm:text-lg">{targetLanguage === 'eu' ? 'euskera' : 'inglés'}</span> para hostelería.
            </p>

            {roleLabel && (
              <p className="mb-6 sm:mb-8 flex flex-wrap items-center gap-2 sm:gap-3 text-secondary" data-testid="dashboard-role">
                <span className="bg-accent/20 text-accent font-black px-3 py-1 sm:px-4 rounded-full text-xs sm:text-sm">
                  Tu ruta: {roleLabel}
                </span>
                {roleFrasesCount > 0 && (
                  <span className="text-xs sm:text-sm">{roleFrasesCount} frases para tu puesto</span>
                )}
                <Link to="/configuracion" className="text-xs sm:text-sm underline hover:text-accent">Cambiar rol</Link>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <StatBadge 
                icon={AcademicCapIcon} 
                label="Nivel Actual" 
                value="Principiante Pro" 
                color="bg-accent" 
              />
              <StatBadge 
                icon={BookmarkIcon} 
                label="En Estudio" 
                value={`${stats.studied} frases`} 
                color="bg-yellow-500" 
              />
              <StatBadge 
                icon={CheckBadgeIcon} 
                label="Aprendidas" 
                value={`${stats.learned} frases`} 
                color="bg-success" 
              />
            </div>
          </div>

          <div className="absolute -right-20 -bottom-20 w-72 sm:w-96 h-72 sm:h-96 bg-accent opacity-10 blur-[100px] rounded-full" aria-hidden="true"></div>
        </section>

        {/* Daily Challenge */}
        <DailyChallengeCard />

        {/* Reto de Cortesía del Día (FD-04) */}
        <Link
          to="/roleplay?reto=cortesia"
          className="group flex items-center justify-between gap-3 sm:gap-4 bg-surface/5 hover:bg-surface/10 border border-accent/30 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-xl transition-all"
          data-testid="politeness-challenge-link"
        >
          <span>
            <span className="block text-[10px] uppercase tracking-widest font-black text-accent">Práctica libre</span>
            <span className="block text-lg sm:text-xl font-black text-primary">Reto de Cortesía del Día</span>
            <span className="block text-xs sm:text-sm text-tertiary">Una situación inesperada con un cliente exigente. ¿Mantienes la diplomacia?</span>
          </span>
          <ArrowRightIcon className="w-5 h-5 sm:w-6 sm:h-6 text-accent group-hover:translate-x-1 transition-transform shrink-0" aria-hidden="true" />
        </Link>

        {/* Modules Grid */}
        <section aria-labelledby="modules-heading">
          <div className="flex items-center gap-3 mb-6 sm:mb-10">
            <span className="w-2 h-8 sm:h-10 bg-accent rounded-full" aria-hidden="true"></span>
            <h2 id="modules-heading" className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">Módulos de Entrenamiento</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
            {modules.map((mod, idx) => (
              <DashboardModule 
                key={mod.title} 
                {...mod} 
                index={idx} 
              />
            ))}
          </div>
        </section>

        {/* Progress Tracker */}
        <section 
          className="bg-surface/5 backdrop-blur-md p-5 sm:p-8 lg:p-10 rounded-2xl sm:rounded-[3rem] border border-border/10 shadow-2xl relative group overflow-hidden"
          aria-labelledby="progress-heading"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10 relative z-10">
            <div className="text-center lg:text-left">
              <h2 id="progress-heading" className="text-xl sm:text-2xl font-bold text-primary mb-1 sm:mb-2">Dominio Global</h2>
              <p className="text-tertiary text-xs sm:text-sm font-medium tracking-wide">¡Sigue así! Estás a punto de alcanzar tu próximo nivel.</p>
            </div>

            <div className="flex-grow max-w-2xl w-full">
              <div className="flex justify-between text-xs font-bold uppercase text-accent mb-2 sm:mb-3 tracking-[0.2em]">
                <span>Progreso del Curso</span>
                <span aria-hidden="true">{stats.percent}%</span>
              </div>
              <div 
                className="w-full h-3.5 sm:h-4 bg-surface/5 rounded-full overflow-hidden border border-border/5 shadow-inner"
                role="progressbar"
                aria-valuenow={stats.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso total del curso: ${stats.percent} por ciento`}
              >
                <div
                  className="h-full bg-gradient-to-r from-accent to-cyan-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(34,211,238,0.35)]"
                  style={{ width: `${stats.percent}%` }}
                ></div>
              </div>
            </div>

            <Link
              to="/progreso"
              className="w-full sm:w-auto text-center group flex items-center justify-center gap-3 bg-surface/5 hover:bg-accent text-primary px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-sm sm:text-base"
            >
              Ver Estadísticas
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

interface StatBadgeProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}

function StatBadge({ icon: Icon, label, value, color }: StatBadgeProps) {
  return (
    <div className="w-full sm:w-auto bg-background/20 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4 rounded-xl sm:rounded-[1.5rem] border border-border/10 flex items-center gap-3 sm:gap-4 shadow-lg hover:bg-background/30 transition-colors">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${color} rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shadow-xl shrink-0`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-semibold text-tertiary tracking-widest leading-none mb-1">
          {label}
        </p>
        <p className="text-primary font-bold text-base sm:text-lg leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function CheckBadgeIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );
}

export default Dashboard;