import React from 'react';
import { useAppStore, Conversation } from '@/store/useAppStore';
import { ChatBubbleLeftRightIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({ conversations, onSelectConversation }) => {
  const { targetLanguage } = useAppStore(state => ({ targetLanguage: state.prefs.targetLanguage }));

  if (conversations.length === 0) {
    return (
      <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-white/10">
        <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
          No hay conversaciones disponibles
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="conversation-list">
      {conversations.map(conv => {
        return (
          <button
            key={conv.id}
            className="group text-left bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 p-8 cursor-pointer hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden active:scale-98 shadow-xl"
            onClick={() => onSelectConversation(conv)}
          >
            {/* Decorative Circle */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent opacity-5 rounded-full group-hover:scale-150 transition-transform"></div>

            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-accent/20 rounded-xl text-accent">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </div>
              <div className="p-2 bg-white/5 rounded-full text-white/40 group-hover:text-accent transition-colors">
                <ChevronRightIcon className="w-5 h-5" />
              </div>
            </div>

            <h3 className="text-xl font-black text-white mb-2 leading-tight">{conv.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4 flex-grow">{conv.description}</p>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                {(() => {
                  const cat = conv.categoria || 'General';
                  if (cat === 'Jatetxea') return 'Restaurante';
                  if (cat === 'Harrera') return 'Recepción';
                  if (cat === 'Kexak') return 'Quejas';
                  if (cat === 'Kexak eta erreklamazioak') return 'Quejas y Reclamaciones';
                  return cat;
                })()}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {conv.dialogue.length} Mensajes
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
