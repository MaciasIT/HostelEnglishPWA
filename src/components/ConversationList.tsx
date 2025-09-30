import React from 'react';

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
  turns: ConversationTurn[];
};

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, onSelectConversation }) => {
  if (conversations.length === 0) {
    return <div className="text-center text-white">No hay conversaciones disponibles.</div>;
  }

  return (
    <div className="space-y-4" data-testid="conversation-list">
      {conversations.map(conv => (
        <div
          key={conv.id}
          className="bg-white/10 rounded-lg shadow-md p-4 cursor-pointer hover:bg-white/20"
          onClick={() => onSelectConversation(conv)}
        >
          <h2 className="text-xl font-semibold text-white">{conv.title}</h2>
          <p className="text-gray-300">{conv.description}</p>
        </div>
      ))}
    </div>
  );
};

export default ConversationList;
