import React, { useState, useMemo, useEffect } from 'react';
import ConversationList from '@/components/ConversationList';
import ConversationUI from '@/features/conversations/components/ConversationUI';
import { useAppStore, Conversation } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import { ChatBubbleLeftRightIcon, FunnelIcon, TrophyIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const Conversaciones: React.FC = () => {
  const { conversations, categories, conversationsLoaded, loadConversations } = useAppStore((state) => ({
    conversations: state.conversations,
    categories: state.categories,
    conversationsLoaded: state.conversationsLoaded,
    loadConversations: state.loadConversations,
  }));

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPostConversationOptions, setShowPostConversationOptions] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (!conversationsLoaded) loadConversations();
  }, [conversationsLoaded, loadConversations]);

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
          title="Módulo de Diálogos"
          description="Sumérgete en situaciones reales de hostelería. Aprende a manejar reservas, quejas y pedidos con naturalidad y confianza."
          icon={ChatBubbleLeftRightIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Escenarios', value: conversations.length },
            { label: 'Interactivo', value: 'SÍ' },
            { label: 'Nivel', value: 'A2/B1' }
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={!selectedConversation ? "Diálogos Profesionales" : undefined}>
      <div className="max-w-6xl mx-auto animate-fade-in">
        {selectedConversation ? (
          <ConversationUI
            conversation={selectedConversation}
            onBack={handleBackToList}
            onConversationEnd={handleConversationEnd}
          />
        ) : (
          <div className="space-y-10">
            {/* Filter Hub */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-2xl text-accent">
                  <FunnelIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">Filtrar Escenarios</h3>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-widest">Selecciona una categoría</p>
                </div>
              </div>

              <div className="relative w-full md:w-80 group">
                <select
                  id="category-filter"
                  className="w-full pl-6 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold appearance-none focus:ring-2 focus:ring-accent outline-none transition-all group-hover:bg-white/10 cursor-pointer"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  aria-label="Filtrar por categoría"
                >
                  <option value="all" className="bg-primary-dark">Todas las situaciones</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-primary-dark">
                      {category}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none group-hover:text-accent transition-colors" aria-hidden="true">
                  <ArrowRightIcon className="w-full h-full rotate-90" />
                </div>
              </div>
            </div>

            <ConversationList
              conversations={filteredConversations}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        )}

        {showPostConversationOptions && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <div className="bg-gradient-to-b from-primary-dark to-black p-10 rounded-[3rem] shadow-2xl text-center text-white border border-white/10 max-w-md w-full relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent opacity-10 blur-3xl rounded-full" aria-hidden="true"></div>

              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <TrophyIcon className="w-10 h-10 text-white" />
              </div>

              <h2 id="success-title" className="text-3xl font-black mb-2">¡Misión Cumplida!</h2>
              <p className="mb-10 text-gray-400 font-medium leading-relaxed">Has completado el escenario con éxito. Tu fluidez está mejorando notablemente.</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleNextConversation()}
                  className="w-full py-4 bg-accent text-white font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Siguiente Diálogo
                </button>
                <button
                  onClick={() => handleBackToList()}
                  className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-sm"
                >
                  Volver al Listado
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Conversaciones;