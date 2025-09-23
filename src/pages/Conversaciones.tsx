import React, { useState, useMemo } from 'react';
import ConversationList from '@/components/ConversationList';
import ConversationDetail from '@/components/ConversationDetail';
import { useAppStore } from '@/store/useAppStore';

type ConversationTurn = {
  speaker: "Hostel Staff" | "Guest";
  english: string;
  spanish: string;
  audio?: string;
};

type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[]; // Cambiado de turns a dialogue
  categoria?: string;
};

export default function Conversaciones() {
  const { conversations, categories } = useAppStore((state) => ({
    conversations: state.conversations,
    categories: state.categories,
  }));
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const displayCategories = ['all', ...categories];

  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const matchesCategory = selectedCategory === 'all' || conversation.categoria === selectedCategory;
      return matchesCategory;
    });
  }, [conversations, selectedCategory]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    return (
      <ConversationDetail conversation={selectedConversation} onBack={handleBackToList} />
    );
  }

  return (
    <div className="p-4 pb-20 bg-primary text-white min-h-screen">
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
    </div>
  );
}
