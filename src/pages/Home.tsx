import { useState } from 'react';
import { Link } from 'react-router';
import {
  MicrophoneIcon,
  BellAlertIcon,
  BeakerIcon,
  HomeModernIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const DEPARTMENTS = [
  { title: 'Sala & Comedor', desc: 'Comandas, alérgenos y trato en mesa.', to: '/frases', emoji: '🍽️' },
  { title: 'Barra & Coctelería', desc: 'Pedidos, cócteles y servicio rápido.', to: '/frases', icon: BeakerIcon },
  { title: 'Recepción', desc: 'Check-in, reservas y quejas.', to: '/roleplay', icon: BellAlertIcon },
  { title: 'Cocina', desc: 'Órdenes, seguridad y coordinación.', to: '/frases', icon: HomeModernIcon },
] as const;

const METRICS = [
  { value: '100%', label: 'On-Device (Zero Server Lag)' },
  { value: 'FSRS-6', label: 'Algoritmo FSRS-6' },
  { value: '20+', label: 'Escenarios Roleplay' },
  { value: 'QR', label: 'Certificaciones QR' },
];

const WAVE = [8, 18, 12, 26, 16, 30, 20];
const RING_LENGTH = 2 * Math.PI * 42;

function HeroShowcase() {
  const [listening, setListening] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="absolute -inset-6 bg-accent/20 blur-3xl rounded-full" aria-hidden="true" />

      <div className="relative bg-surface/70 backdrop-blur-xl border border-border rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 shadow-2xl space-y-3 sm:space-y-4">
        {/* Racha diaria */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent font-black text-xs sm:text-sm tracking-wide">
            <span aria-hidden="true">🔥</span> 14 DÍAS
          </div>
          <span className="text-[11px] sm:text-xs text-tertiary font-semibold uppercase tracking-widest">Racha diaria</span>
        </div>

        {/* Roleplay */}
        <div className="bg-surface-elevated/80 border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-2.5 sm:space-y-3">
          <p className="text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold">Roleplay · Recepción</p>
          <div className="flex items-start gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black flex items-center justify-center text-xs sm:text-sm">S</div>
            <div className="bg-background/60 border border-border rounded-2xl rounded-tl-sm px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-primary">
              <span className="block text-[11px] sm:text-xs font-bold text-accent mb-0.5">Sarah</span>
              “Good evening, is my room ready?”
            </div>
          </div>
          <div className="flex items-center justify-end gap-2.5 sm:gap-3">
            <span className="text-[11px] sm:text-xs text-secondary">
              {listening ? 'Escuchando…' : 'Tu turno: responde en voz alta'}
            </span>
            <button
              type="button"
              onClick={() => setListening((v) => !v)}
              aria-pressed={listening}
              aria-label="Responder con micrófono"
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 ${listening ? 'animate-pulse ring-4 ring-emerald-400/40' : ''}`}
            >
              <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Anillo de voz */}
        <div className="flex items-center gap-3 sm:gap-4 bg-surface-elevated/80 border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0" role="img" aria-label="Calificación de voz: 98% excelente">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
              <circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
                stroke="#10b981"
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH * 0.02}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center gap-[2px]" aria-hidden="true">
              {WAVE.map((h, i) => (
                <span
                  key={i}
                  className="w-[2.5px] sm:w-[3px] rounded-full bg-emerald-400 animate-pulse"
                  style={{ height: `${h}px`, animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">98%</p>
            <p className="text-xs sm:text-sm font-black text-accent tracking-wide">EXCELLENT!</p>
            <p className="text-[11px] sm:text-xs text-tertiary mt-0.5 sm:mt-1 truncate sm:whitespace-normal">Pronunciación evaluada en tu dispositivo</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="text-primary min-h-screen bg-background overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-4 sm:pt-10 lg:pt-14 pb-10 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/20 blur-[120px] rounded-full" aria-hidden="true" />
        <div className="absolute bottom-0 -right-24 w-72 sm:w-96 h-72 sm:h-96 bg-cyan-500/15 blur-[120px] rounded-full" aria-hidden="true" />

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative z-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-accent/10 border border-accent/30 rounded-full text-[11px] sm:text-xs font-black tracking-wide text-accent mb-4 sm:mb-6 shadow-lg shadow-emerald-500/10">
              ✨ HostelEnglish 2026 Pro · On-Device AI &amp; Audio
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-black mb-4 sm:mb-6 tracking-tight leading-[1.15] sm:leading-[1.05]">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                HostelEnglish 2026: El inglés y euskera de hostelería con IA en tu dispositivo
              </span>
            </h1>

            <p className="text-sm sm:text-lg lg:text-xl mb-6 sm:mb-8 text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Practica frases, roleplays y pronunciación con feedback instantáneo, sin servidores y sin esperas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-500/25 py-3.5 px-6 sm:py-4 sm:px-10 rounded-2xl text-base sm:text-lg tracking-wider sm:tracking-widest transition-all active:scale-95"
              >
                EMPEZAR AHORA
                <ArrowRightIcon className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                to="/progreso"
                className="w-full sm:w-auto bg-surface/60 hover:bg-surface-elevated text-primary font-bold py-3.5 px-6 sm:py-4 sm:px-10 rounded-2xl text-base sm:text-lg border border-border transition-all text-center tracking-wider sm:tracking-widest"
              >
                MI PROGRESO
              </Link>
            </div>
          </div>

          <HeroShowcase />
        </div>
      </section>

      {/* Departamentos */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black text-primary mb-3">Especialidades por Departamento</h2>
            <p className="text-tertiary max-w-2xl mx-auto">
              Elige tu puesto y entra directo al vocabulario que usarás cada turno.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEPARTMENTS.map((d) => {
              const Icon = 'icon' in d ? d.icon : null;
              return (
                <Link
                  key={d.title}
                  to={d.to}
                  className="group bg-surface/70 backdrop-blur-xl p-6 rounded-3xl border border-border hover:border-accent/50 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all"
                >
                  <div className="bg-accent/15 w-12 h-12 rounded-2xl flex items-center justify-center text-accent text-2xl mb-4 group-hover:scale-110 transition-transform">
                    {Icon ? <Icon className="w-6 h-6" aria-hidden="true" /> : <span aria-hidden="true">{'emoji' in d ? d.emoji : ''}</span>}
                  </div>
                  <h3 className="text-lg font-black text-primary mb-1">{d.title}</h3>
                  <p className="text-sm text-tertiary mb-3">{d.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-bold text-accent">
                    Entrar <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Métricas 2026 */}
      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {METRICS.map((m) => (
            <div key={m.label} className="bg-surface/70 border border-border rounded-3xl p-6 text-center">
              <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {m.value}
              </p>
              <p className="text-xs uppercase tracking-widest text-tertiary font-semibold">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-border text-center">
        <Link to="/" className="text-2xl font-black text-primary mb-4 block">
          Hostel<span className="text-accent">English</span>
        </Link>
        <p className="text-tertiary text-sm max-w-sm mx-auto mb-6">
          Transformando la comunicación en el sector hostelero a través de la tecnología y el aprendizaje interactivo.
        </p>
        <p className="text-xs text-tertiary">
          © {new Date().getFullYear()} HostelEnglish. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
