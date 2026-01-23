import React, { useState, useMemo } from 'react';
import ConversationList from '@/components/ConversationList';
import ConversationDetail from '@/components/ConversationDetail';
import { useAppStore, Conversation } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function Conversaciones() {
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
    setShowPostConversationOptions(false);
  };

  const handleBackToList = () => {
    window.speechSynthesis.cancel();
    setSelectedConversation(null);
    setShowPostConversationOptions(false);
  };

  const handleConversationEnd = () => {
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

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Conversaciones"
          description="Practica con diálogos reales y mejora tu fluidez y pronunciación en situaciones comunes del sector hostelero."
          icon={ChatBubbleLeftIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Diálogos', value: conversations.length },
            { label: 'Categorías', value: categories.length },
            { label: 'Dificultad', value: 'Media' }
          ]}
        />
      </PageContainer>
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-dark p-8 rounded-3xl shadow-2xl text-center text-white border border-white/10 backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-4">¡Buen trabajo!</h2>
            <p className="mb-8 text-gray-300">Has completado esta conversación. ¿Qué te gustaría hacer ahora?</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => handleNextConversation()}
                className="px-6 py-3 bg-accent rounded-2xl text-white font-bold hover:brightness-110 transition-all"
              >
                Siguiente Diálogo
              </button>
              <button
                onClick={() => handleBackToList()}
                className="px-6 py-3 bg-white/10 rounded-2xl text-white font-bold hover:bg-white/20 transition-all"
              >
                Volver al Listado
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}