import React from 'react';
import { Link } from 'react-router-dom';

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

export default function Home() {
  return (
    <div className="text-white">
      {/* Hero Section */}
      <section className="bg-primary py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <img src={`${import.meta.env.BASE_URL}icons/icono.png`} alt="HostelEnglish Logo" className="mx-auto mb-4 w-40 h-40" />
          <h1 className="text-5xl font-bold mb-4">HostellinglésApp</h1>
          <p className="text-xl mb-8">Aprende Inglés para hostelería de forma interactiva.</p>
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
          <h2 className="text-4xl font-bold text-center mb-12">¿Por qué HostellinglésApp?</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <FeatureCard
              title="Aprende vocabulario"
              description="Esencial para hostelería."
            />
            <FeatureCard
              title="Practica con conversaciones"
              description="Y diálogos reales."
            />
            <FeatureCard
              title="Mejora tu pronunciación"
              description="Y fluidez."
            />
            <FeatureCard
              title="Prepárate para situaciones cotidianas"
              description="En hoteles y restaurantes."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-dark py-4 text-center text-sm">
        <p>© {new Date().getFullYear()} HostellinglésApp. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}