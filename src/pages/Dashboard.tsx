import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

export default function Dashboard() {
  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="bg-primary py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Placeholder para el logo */}
          <div className="mb-4 text-4xl">🚀</div>
          <h1 className="text-5xl font-bold mb-4">Dashboard</h1>
          <p className="text-xl mb-8">Tu centro de control para el aprendizaje de inglés para hostelería.</p>
          <Link
            to="/frases"
            className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
          >
            Empezar a Aprender
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-accent py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">¿Qué encontrarás aquí?</h2>
          <div className="grid md:grid-cols-1 gap-8">
            <FeatureCard
              title="Acceso Rápido a Módulos"
              description="Navega fácilmente a los módulos de Frases, Flashcards, Conversaciones, Examen y Progreso. Todo lo que necesitas para aprender está a un solo clic."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-dark py-4 text-center text-sm">
        <p>© 2025 HostellinglésApp. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}