import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ConversationList from '@/components/ConversationList';
import ConversationDetail from '@/components/ConversationDetail';
import { useAppStore } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';

type ConversationTurn = {
  speaker: string;
  en: string;
  es: string;
  audio?: string;
};

type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[];
  categoria?: string;
  participants: string[];
};

const FeatureCard = ({ title, description }: { title: string, description: string }) => (
  <div className="bg-white/20 p-6 rounded-lg shadow-lg text-center">
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p>{description}</p>
  </div>
);

export default function Conversaciones() {
  // Handler global para detener la voz al pulsar cualquier botón
  const handleAnyButton = (e: React.MouseEvent<HTMLButtonElement>) => {
    window.speechSynthesis.cancel();
  };
  const { conversations, categories } = useAppStore((state) => ({
    conversations: state.conversations,
    categories: state.categories,
  }));
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPostConversationOptions, setShowPostConversationOptions] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const displayCategories = ['all', ...categories];

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const matchesCategory = selectedCategory === 'all' || conversation.categoria === selectedCategory;
      return matchesCategory;
    });
  }, [conversations, selectedCategory]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setShowPostConversationOptions(false); // Reset options when a new conversation is selected
  };

  const handleBackToList = () => {
    window.speechSynthesis.cancel(); // Detiene cualquier reproducción de voz al salir de la conversación
    setSelectedConversation(null);
    setShowPostConversationOptions(false); // Hide options when going back to list
  };

  const handleConversationEnd = () => {
    console.log("handleConversationEnd called. Setting showPostConversationOptions to true.");
    setShowPostConversationOptions(true);
  };

  const handleNextConversation = () => {
    const currentIndex = filteredConversations.findIndex(c => c.id === selectedConversation?.id);
    if (currentIndex !== -1 && currentIndex < filteredConversations.length - 1) {
      setSelectedConversation(filteredConversations[currentIndex + 1]);
      setShowPostConversationOptions(false);
    } else {
      handleBackToList();
    }
  };

  const handleReturnToList = () => {
    handleBackToList();
  };

  if (showWelcome) {
    return (
      <div className="text-white">
        {/* Hero Section */}
        <section className="bg-primary py-20 px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <img src={`${import.meta.env.BASE_URL}icons/icono.png`} alt="HostelEnglish Logo" className="mx-auto mb-4 w-32 h-32" />
            <h1 className="text-5xl font-bold mb-4">Módulo de Conversaciones</h1>
            <p className="text-xl mb-8">Practica con diálogos reales y mejora tu fluidez y pronunciación.</p>
            <button
              onClick={() => setShowWelcome(false)}
              className="bg-accent hover:bg-accent-dark text-white font-bold py-3 px-8 rounded-full text-lg transition duration-300"
            >
              Empezar a Practicar
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-accent py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12">¿Qué encontrarás aquí?</h2>
            <div className="grid md:grid-cols-1 gap-8">
              <FeatureCard
                title="Diálogos Interactivos"
                description="Escucha y repite conversaciones comunes en el entorno de la hostelería. Practica con diferentes acentos y situaciones para ganar confianza."
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

  return (
    <PageContainer title={!selectedConversation ? "Conversaciones" : undefined}>
      {selectedConversation ? (
        <ConversationDetail
          conversation={selectedConversation}
          onBack={handleBackToList}
          onConversationEnd={handleConversationEnd}
        />
      ) : (
        <>
          <div className="mb-6">
            <label htmlFor="category-select" className="block mb-2 text-sm font-medium text-white">Filtrar por categoría:</label>
            <select
              id="category-select"
              className="w-full p-2 border rounded-md bg-primary-dark border-primary-dark text-white"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {displayCategories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas las categorías' : category}
                </option>
              ))}
            </select>
          </div>

          <ConversationList conversations={filteredConversations} onSelectConversation={handleSelectConversation} />
        </>
      )}

      {showPostConversationOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-primary-dark p-6 rounded-lg shadow-lg text-center text-white">
            <h2 className="text-xl font-bold mb-4 text-white">Conversación Terminada</h2>
            <p className="mb-6 text-white">¿Qué quieres hacer a continuación?</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={e => { handleAnyButton(e); handleNextConversation(); }}
                className="px-4 py-2 bg-accent rounded-md text-white hover:bg-accent-dark"
              >
                Siguiente Conversación
              </button>
              <button
                onClick={e => { handleAnyButton(e); handleReturnToList(); }}
                className="px-4 py-2 bg-primary rounded-md text-white hover:bg-primary-dark"
              >
                Volver a la Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}