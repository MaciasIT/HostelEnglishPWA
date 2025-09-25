import React, { useState, useMemo } from 'react';
import ConversationList from '@/components/ConversationList';
import ConversationDetail from '@/components/ConversationDetail';
import { useAppStore } from '@/store/useAppStore';

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

export default function Conversaciones() {
  const { conversations, categories } = useAppStore((state) => ({
    conversations: state.conversations,
    categories: state.categories,
  }));
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showPostConversationOptions, setShowPostConversationOptions] = useState(false);

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
    setSelectedConversation(null);
    setShowPostConversationOptions(false); // Hide options when going back to list
  };

  /**
   * Handles the event when a conversation finishes playing all its turns.
   * It sets a state to show options for navigating to the next conversation or returning to the list.
   */
  const handleConversationEnd = () => {
    console.log("handleConversationEnd called. Setting showPostConversationOptions to true.");
    setShowPostConversationOptions(true);
  };

  /**
   * Handles navigation to the next conversation in the filtered list.
   * If there is a next conversation, it sets it as the selected conversation.
   * Otherwise, it returns to the main list.
   */
  const handleNextConversation = () => {
    const currentIndex = filteredConversations.findIndex(c => c.id === selectedConversation?.id);
    if (currentIndex !== -1 && currentIndex < filteredConversations.length - 1) {
      setSelectedConversation(filteredConversations[currentIndex + 1]);
      setShowPostConversationOptions(false);
    } else {
      // If no next conversation, go back to the list
      handleBackToList();
    }
  };

  /**
   * Handles returning to the main conversation list.
   */
  const handleReturnToList = () => {
    handleBackToList();
  };

  return (
    <div className="p-4 pb-20 bg-primary text-white min-h-screen">
      {selectedConversation ? (
        <ConversationDetail
          conversation={selectedConversation}
          onBack={handleBackToList}
          onConversationEnd={handleConversationEnd}
        />
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4 text-white">Conversaciones</h1>

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
                onClick={handleNextConversation}
                className="px-4 py-2 bg-accent rounded-md text-white hover:bg-accent-dark"
              >
                Siguiente Conversación
              </button>
              <button
                onClick={handleReturnToList}
                className="px-4 py-2 bg-primary rounded-md text-white hover:bg-primary-dark"
              >
                Volver a la Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}