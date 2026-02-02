import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import {
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  MapIcon,
  MicrophoneIcon,
  Square2StackIcon,
  ChartBarIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { frases, progress, loadFrases, frasesLoaded } = useAppStore();
  const targetLanguage = useAppStore(state => state.prefs.targetLanguage);

  React.useEffect(() => {
    if (!frasesLoaded) loadFrases();
  }, [frasesLoaded, loadFrases]);

  const stats = useMemo(() => {
    const total = frases.length;
    const studied = Object.values(progress).filter(v => v === 1).length;
    const learned = Object.values(progress).filter(v => v === 2).length;
    // Calculate progress: Learned = 100%, Studied = 50%
    const percent = total > 0 ? Math.round(((studied * 0.5 + learned) / total) * 100) : 0;
    return { total, studied, learned, percent };
  }, [frases, progress]);

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
    <PageContainer title="Dashboard">
      <div className="max-w-6xl mx-auto space-y-10 pb-12">

        {/* Welcome Section */}
        <section className="bg-gradient-to-br from-primary-light to-primary-dark p-6 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-white/10">
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-5xl font-black text-white mb-4">
              ¡Hola de nuevo! 🏨
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-xl">
              Continúa tu formación en {targetLanguage === 'eu' ? 'euskera' : 'inglés'} para hostelería. Tu camino hacia la fluidez profesional empieza aquí.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white shadow-lg">
                  <AcademicCapIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    Nivel Actual
                  </p>
                  <p className="text-white font-black">
                    Principiante Pro
                  </p>
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <BookmarkIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    En Estudio
                  </p>
                  <p className="text-white font-black">
                    {stats.studied} frases
                  </p>
                </div>
              </div>

              <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <CheckBadgeIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">
                    Aprendidas
                  </p>
                  <p className="text-white font-black">
                    {stats.learned} frases
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative element */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-accent opacity-10 blur-[100px] rounded-full"></div>
        </section>

        {/* Learning Modules Grid */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <span className="w-3 h-8 bg-accent rounded-full"></span>
              Módulos de Aprendizaje
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod, idx) => (
              <Link
                key={idx}
                to={mod.path}
                className="group bg-white/5 hover:bg-white/10 p-6 sm:p-8 rounded-[2rem] border border-white/10 transition-all hover:scale-[1.02] hover:shadow-2xl active:scale-95 flex flex-col items-center text-center"
              >
                <div className={`${mod.color} w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white mb-4 sm:mb-6 shadow-xl group-hover:rotate-6 transition-transform`}>
                  <mod.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mb-2">{mod.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm">{mod.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Progress Summary */}
        <section className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-black text-white">
                Tu Progreso Global
              </h3>
              <p className="text-gray-400 text-sm">
                Vas por muy buen camino. ¡Sigue así!
              </p>
            </div>
            <div className="flex-grow max-w-xl w-full">
              <div className="flex justify-between text-xs font-black uppercase text-accent mb-2 tracking-widest">
                <span>Dominio del curso</span>
                <span>{stats.percent}%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-blue-500 rounded-full"
                  style={{ width: `${stats.percent}%` }}
                ></div>
              </div>
            </div>
            <Link
              to="/progreso"
              className="whitespace-nowrap bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              Ver estadísticas
            </Link>
          </div>
        </section>

      </div>
    </PageContainer>
  );
}

function CheckBadgeIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  )
}