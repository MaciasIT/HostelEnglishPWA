import React, { useState } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { useAppStore } from '@/store/useAppStore';

type ConversationTurn = {
  speaker: string; // Más genérico para aceptar cualquier rol
  en: string;
  es: string;
  audio?: string;
};

type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[];
  participants: string[]; // Añadir participants
};

interface ConversationDetailProps {
  conversation: Conversation;
  onBack: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, onBack }) => {
  const { playAudio } = useAudio();
  const audioSpeed = useAppStore((state) => state.prefs.audioSpeed);
  const [selectedRole, setSelectedRole] = useState('Todos');

  const handlePlayTurn = (turn: ConversationTurn) => {
    if (turn.audio) {
      playAudio(`/audio/${turn.audio}`, audioSpeed);
    } else {
      playAudio(turn.en, audioSpeed, true);
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-gray-800 dark:text-white"
      >
        ← Volver a la lista
      </button>
      <h1 className="text-2xl font-bold mb-4">{conversation.title}</h1>
      <p className="text-gray-600 dark:text-gray-300 mb-6">{conversation.description}</p>

      <div className="mb-6">
        <label htmlFor="role-select" className="block mb-2 text-sm font-medium text-gray-900 dark:text-gray-300">Tu Rol:</label>
        <select
          id="role-select"
          className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="Todos">Todos</option>
          {conversation.participants.map(participant => (
            <option key={participant} value={participant}>{participant}</option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {conversation.dialogue.map((turn, index) => {
          const isMyTurn = turn.speaker === selectedRole;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg shadow-md ${isMyTurn ? "bg-yellow-100 dark:bg-yellow-900" : (turn.speaker === conversation.participants[0] ? "bg-blue-100 dark:bg-blue-900" : "bg-green-100 dark:bg-green-900")}`}
            >
              <p className="font-semibold mb-1">{turn.speaker}:</p>
              {isMyTurn ? (
                <p className="text-lg italic text-gray-500 dark:text-gray-400">Tu turno...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">{turn.en}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm italic">{turn.es}</p>
                  <button
                    onClick={() => handlePlayTurn(turn)}
                    className="mt-3 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Reproducir
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationDetail;
