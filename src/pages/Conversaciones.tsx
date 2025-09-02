import React, { useState } from 'react';
import ConversationList from '@/components/ConversationList';
import BottomNav from '@/components/BottomNav';

type Conversation = {
  id: string;
  title: string;
  scenario: string;
  phrases: { role: string; text: string; audio?: string }[];
};

export default function Conversaciones() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    // Aquí iría la pantalla de configuración y la conversación interactiva
    return (
      <div className="p-4 pb-20">
        <button
          onClick={handleBackToList}
          className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white"
        >
          ← Volver a la lista
        </button>
        <h1 className="text-2xl font-bold mb-4">{selectedConversation.title}</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedConversation.scenario}</p>
        {/* Placeholder para la lógica de configuración y conversación */}
        <p className="text-center text-gray-500 dark:text-gray-400">Lógica de conversación en construcción...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold mb-4">Conversaciones</h1>
      <ConversationList onSelectConversation={handleSelectConversation} />
      <BottomNav />
    </div>
  );
}
