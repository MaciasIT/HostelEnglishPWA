import { Conversation } from '@/store/useAppStore';
import { ChatBubbleLeftRightIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
}

const ConversationList = ({ conversations, onSelectConversation }: ConversationListProps) => {
  // targetLanguage was unused here

  if (conversations.length === 0) {
    return (
      <div className="text-center py-20 bg-surface/5 rounded-[2rem] border border-border/10">
        <ChatBubbleLeftRightIcon className="w-16 h-16 text-tertiary mx-auto mb-4" />
        <p className="text-tertiary font-bold uppercase tracking-widest text-sm">
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
            className="group text-left bg-surface/5 backdrop-blur-md rounded-[2rem] border border-border/10 p-8 cursor-pointer hover:bg-surface/10 hover:border-border/20 hover:-translate-y-1 transition-all flex flex-col relative overflow-hidden active:scale-98 shadow-xl"
            onClick={() => onSelectConversation(conv)}
          >
            {/* Decorative Circle */}
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-accent opacity-5 rounded-full group-hover:scale-150 transition-transform"></div>

            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-accent/20 rounded-xl text-accent-text">
                <ChatBubbleLeftRightIcon className="w-6 h-6" />
              </div>
              <div className="p-2 bg-surface/5 rounded-full text-primary/40 group-hover:text-accent-text transition-colors">
                <ChevronRightIcon className="w-5 h-5" />
              </div>
            </div>

            <h3 className="text-xl font-black text-primary mb-2 leading-tight">{conv.title}</h3>
            <p className="text-tertiary text-sm leading-relaxed mb-4 flex-grow">{conv.description}</p>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-accent-text bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                {(() => {
                  const cat = conv.categoria || 'General';
                  if (cat === 'Jatetxea') return 'Restaurante';
                  if (cat === 'Harrera') return 'Recepción';
                  if (cat === 'Kexak') return 'Quejas';
                  if (cat === 'Kexak eta erreklamazioak') return 'Quejas y Reclamaciones';
                  return cat;
                })()}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">
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
