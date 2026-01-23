import React from 'react';

import { Conversation } from '@/store/useAppStore';

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
