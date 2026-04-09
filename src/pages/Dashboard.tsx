import React from 'react';
import { Link } from 'react-router-dom';
import { useDashboardLogic } from '@/features/dashboard/hooks/useDashboardLogic';
import DashboardModule from '@/features/dashboard/components/DashboardModule';
import PageContainer from '@/components/layout/PageContainer';
import {
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  MapIcon,
  MicrophoneIcon,
  Square2StackIcon,
  ChartBarIcon,
  BookmarkIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { stats, targetLanguage } = useDashboardLogic();

  const modules = [
    {
      title: 'Frases',
      path: '/frases',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-blue-500',
      desc: 'Esenciales del día a día'
    },
    {
      title: 'Diálogos',
      path: '/conversaciones',
      icon: MapIcon,
      color: 'bg-green-500',
      desc: 'Simulaciones reales'
    },
    {
      title: 'Dictado',
      path: '/dictado',
      icon: MicrophoneIcon,
      color: 'bg-red-500',
      desc: 'Entrena tu oído'
    },
    {
      title: 'Flashcards',
      path: '/flashcards',
      icon: Square2StackIcon,
      color: 'bg-yellow-600',
      desc: 'Memorización rápida'
    },
    {
      title: 'Quiz',
      path: '/quiz',
      icon: AcademicCapIcon,
      color: 'bg-purple-500',
      desc: '¡Ponte a prueba!'
    },
    {
      title: 'Progreso',
      path: '/progreso',
      icon: ChartBarIcon,
      color: 'bg-orange-500',
      desc: 'Mira tus logros'
    },
  ];

  return (
    <PageContainer title="Dashboard de Usuario">
      <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-fade-in">

        {/* Welcome Section */}
        <section 
          className="bg-gradient-to-br from-primary-light to-primary-dark p-8 sm:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden border border-white/10"
          aria-labelledby="welcome-heading"
        >
          <div className="relative z-10">
            <h1 id="welcome-heading" className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tighter">
              ¡Hola de nuevo! 🏨
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-10 max-w-2xl font-medium leading-relaxed">
              Continúa tu formación en <span className="text-accent font-black uppercase text-lg">{targetLanguage === 'eu' ? 'euskera' : 'inglés'}</span> para hostelería.
            </p>

            <div className="flex flex-wrap items-center gap-4">
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
                color="bg-green-500" 
              />
            </div>
          </div>

          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-accent opacity-10 blur-[100px] rounded-full" aria-hidden="true"></div>
        </section>

        {/* Modules Grid */}
        <section aria-labelledby="modules-heading">
          <div className="flex items-center gap-3 mb-10">
            <span className="w-2 h-10 bg-accent rounded-full" aria-hidden="true"></span>
            <h2 id="modules-heading" className="text-3xl font-bold text-white tracking-tight">Módulos de Entrenamiento</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
          className="bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 shadow-2xl relative group overflow-hidden"
          aria-labelledby="progress-heading"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 relative z-10">
            <div className="text-center lg:text-left">
              <h2 id="progress-heading" className="text-2xl font-bold text-white mb-2">Dominio Global</h2>
              <p className="text-gray-400 font-medium tracking-wide">¡Sigue así! Estás a punto de alcanzar tu próximo nivel.</p>
            </div>

            <div className="flex-grow max-w-2xl w-full">
              <div className="flex justify-between text-xs font-bold uppercase text-accent mb-3 tracking-[0.2em]">
                <span>Progreso del Curso</span>
                <span aria-hidden="true">{stats.percent}%</span>
              </div>
              <div 
                className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner"
                role="progressbar"
                aria-valuenow={stats.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progreso total del curso: ${stats.percent} por ciento`}
              >
                <div
                  className="h-full bg-gradient-to-r from-accent to-blue-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  style={{ width: `${stats.percent}%` }}
                ></div>
              </div>
            </div>

            <Link
              to="/progreso"
              className="group flex items-center gap-3 bg-white/5 hover:bg-accent text-white px-8 py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95"
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
    <div className="bg-black/20 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 flex items-center gap-4 shadow-lg hover:bg-black/30 transition-colors">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-xl`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-widest leading-none mb-1">
          {label}
        </p>
        <p className="text-white font-bold text-lg leading-tight">
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