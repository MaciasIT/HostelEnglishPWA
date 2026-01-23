import React from 'react';
import { Link } from 'react-router-dom';
import {
  SparklesIcon,
  UserGroupIcon,
  MapPinIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const FeatureCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: any }) => (
  <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-2 group shadow-2xl">
    <div className="bg-accent/20 w-14 h-14 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
      <Icon className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-black text-white mb-3">{title}</h3>
    <p className="text-gray-400 leading-relaxed text-sm">{description}</p>
  </div>
);

export default function Home() {
  return (
    <div className="text-white min-h-screen bg-primary-dark overflow-x-hidden">
      {/* Hero Section with Glassmorphism */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-accent opacity-20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-500 opacity-20 blur-[120px] rounded-full animate-pulse delay-1000"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-black uppercase tracking-[0.2em] text-accent mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <SparklesIcon className="w-4 h-4" />
            La forma más rápida de hablar inglés
          </div>

          <h1 className="text-6xl sm:text-8xl font-black mb-8 tracking-tighter leading-[0.9] animate-in fade-in slide-in-from-top-8 duration-700 delay-100">
            Hostel<span className="text-accent">English</span><br />
            Professional <span className="text-gray-500">App</span>
          </h1>

          <p className="text-xl sm:text-2xl mb-12 text-gray-400 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-top-12 duration-700 delay-200">
            Domina el vocabulario y las expresiones esenciales para destacar en el mundo de la hostelería profesional.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-top-16 duration-700 delay-300">
            <Link
              to="/dashboard"
              className="w-full sm:w-auto bg-accent hover:brightness-110 text-white font-black py-5 px-12 rounded-2xl text-xl shadow-2xl transform active:scale-95 transition-all text-center tracking-widest"
            >
              EMPEZAR AHORA
            </Link>
            <Link
              to="/progreso"
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold py-5 px-12 rounded-2xl text-xl border border-white/10 transition-all text-center tracking-widest"
            >
              VER MI PROGRESO
            </Link>
          </div>

          {/* Mockup Preview / Visual Element */}
          <div className="mt-20 relative px-4 text-center max-w-4xl mx-auto">
            <div className="bg-gradient-to-t from-primary-dark via-transparent to-transparent absolute inset-0 z-20"></div>
            <img
              src={`${import.meta.env.BASE_URL}icons/pwa-512x512.png`}
              alt="App Interface"
              className="w-48 h-48 sm:w-64 sm:h-64 mx-auto rounded-[3rem] shadow-2xl border-4 border-white/10 rotate-3 animate-in zoom-in duration-1000 delay-500"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-6">Diseñado para Hostelería</h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Olvida los cursos genéricos. Aprende lo que realmente necesitas para trabajar en hoteles, restaurantes y eventos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={AcademicCapIcon}
              title="Aprendizaje Activo"
              description="Interactúa con frases y recibe feedback instantáneo para acelerar tu asimilación."
            />
            <FeatureCard
              icon={UserGroupIcon}
              title="Diálogos Reales"
              description="Practica situaciones comunes entre staff y clientes con audios de alta calidad."
            />
            <FeatureCard
              icon={SparklesIcon}
              title="Voz y Pronunciación"
              description="Ajusta la velocidad y tono de las voces para entrenar tu oído según tu nivel."
            />
            <FeatureCard
              icon={MapPinIcon}
              title="Siempre Contigo"
              description="Instálalo como PWA y practica en cualquier lugar, incluso sin conexión."
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <div>
            <p className="text-5xl font-black text-accent mb-2">500+</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Frases Útiles</p>
          </div>
          <div>
            <p className="text-5xl font-black text-accent mb-2">20+</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Escenarios</p>
          </div>
          <div>
            <p className="text-5xl font-black text-accent mb-2">100%</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Gratis</p>
          </div>
          <div>
            <p className="text-5xl font-black text-accent mb-2">PWA</p>
            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Native Feeling</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <Link to="/" className="text-2xl font-black text-white mb-6 block">
          Hostel<span className="text-accent">English</span>
        </Link>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-8">
          Transformando la comunicación en el sector hostelero a través de la tecnología y el aprendizaje interactivo.
        </p>
        <p className="text-xs text-gray-600">
          © {new Date().getFullYear()} HostellinglésApp. Todos los derechos reservados.
        </p>
      </footer>

      {/* Global CSS for animations if not in index.css */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-from-top { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes zoom-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-in { animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .slide-in-from-top-4 { animation-name: slide-in-from-top; }
        .duration-700 { animation-duration: 700ms; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
        .rotate-3 { transform: rotate(3deg); }
      `}} />
    </div>
  );
}