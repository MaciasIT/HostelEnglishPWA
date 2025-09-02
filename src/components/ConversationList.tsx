import React, { useEffect, useState } from 'react';

type Conversation = {
  id: string;
  title: string;
  scenario: string;
  phrases: { role: string; text: string; audio?: string }[];
};

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await fetch('/data/conversations_extended_v4.json');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data: Conversation[] = await res.json();
        setConversations(data);
      } catch (e: any) {
        setError(e.message);
        console.error("Error loading conversations:", e);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, []);

  if (loading) {
    return <div className="text-center text-gray-500 dark:text-gray-400">Cargando conversaciones...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500 dark:text-red-400">Error al cargar las conversaciones: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {conversations.map(conv => (
        <div
          key={conv.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => onSelectConversation(conv)}
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{conv.title}</h2>
          <p className="text-gray-600 dark:text-gray-300">{conv.scenario}</p>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
