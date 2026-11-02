import React, { useState, useMemo, useEffect } from 'react';
import ConversationList from '@/components/ConversationList';
import ConversationUI from '@/features/conversations/components/ConversationUI';
import { useAppStore, useShallow, Conversation } from '@/store/useAppStore';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import { ChatBubbleLeftRightIcon, FunnelIcon, TrophyIcon } from '@heroicons/react/24/outline';
import CategoryChips, { emojiForCategory } from '@/components/CategoryChips';

const Conversaciones: React.FC = () => {
  const { conversations, categories, conversationsLoaded, loadConversations } = useAppStore(
    useShallow((state) => ({
      conversations: state.conversations,
      categories: state.categories,
      conversationsLoaded: state.conversationsLoaded,
      loadConversations: state.loadConversations,
    })),
  );

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
            <div className="bg-surface/5 backdrop-blur-xl border border-border/10 rounded-[2.5rem] p-5 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-2xl text-accent-text">
                  <FunnelIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-primary font-black text-lg">Filtrar Escenarios</h3>
                  <p className="text-[10px] text-tertiary uppercase font-semibold tracking-widest">Selecciona una categoría</p>
                </div>
              </div>

              <CategoryChips
                ariaLabel="Filtrar por categoría"
                className="w-full md:flex-1 md:justify-end"
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: 'all', label: 'Todas', emoji: '🌐' },
                  ...categories.map((c) => ({ value: c, label: c, emoji: emojiForCategory(c) })),
                ]}
              />
            </div>

            <ConversationList
              conversations={filteredConversations}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        )}

        {showPostConversationOptions && (
          <div 
            className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-title"
          >
            <div className="bg-gradient-to-b from-primary-dark to-black p-10 rounded-[3rem] shadow-2xl text-center text-primary border border-border/10 max-w-md w-full relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent opacity-10 blur-3xl rounded-full" aria-hidden="true"></div>

              <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <TrophyIcon className="w-10 h-10 text-primary" />
              </div>

              <h2 id="success-title" className="text-3xl font-black mb-2">¡Misión Cumplida!</h2>
              <p className="mb-10 text-tertiary font-medium leading-relaxed">Has completado el escenario con éxito. Tu fluidez está mejorando notablemente.</p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleNextConversation()}
                  className="w-full py-4 bg-accent text-primary font-black rounded-2xl shadow-xl hover:brightness-110 active:scale-95 transition-all uppercase tracking-widest"
                >
                  Siguiente Diálogo
                </button>
                <button
                  onClick={() => handleBackToList()}
                  className="w-full py-4 bg-surface/5 text-primary font-bold rounded-2xl hover:bg-surface/10 active:scale-95 transition-all text-sm"
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