import React, { useState } from 'react';
// import { useAudio } from '@/hooks/useAudio'; // REMOVE THIS
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
  // const { playAudio } = useAudio(); // REMOVE THIS
  const audioSpeed = useAppStore((state) => state.prefs.audioSpeed);
  const [selectedRole, setSelectedRole] = useState('Todos');

  const handlePlayTurn = (turn: ConversationTurn) => {
    const textToSpeak = turn.en || ''; // Ensure text is a string
    const speechLang = 'en-US'; // Assuming English for conversation turns

    if (!textToSpeak.trim()) {
      console.warn("Attempted to speak empty text.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = speechLang;
    utterance.rate = audioSpeed;

    // No cancellation logic for this diagnostic test
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-4 bg-primary text-white min-h-screen">
      <button
        onClick={onBack}
        className="mb-4 px-4 py-2 bg-primary-dark rounded-md text-white hover:bg-primary"
      >
        ← Volver a la lista
      </button>
      <h1 className="text-2xl font-bold mb-4 text-white">{conversation.title}</h1>
      <p className="text-gray-300 mb-6">{conversation.description}</p>

      <div className="mb-6">
        <label htmlFor="role-select" className="block mb-2 text-sm font-medium text-white">Tu Rol:</label>
        <select
          id="role-select"
          className="w-full p-2 border rounded-md bg-primary-dark border-primary-dark text-white"
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
              className={`p-4 rounded-lg shadow-md ${isMyTurn ? "bg-accent" : (turn.speaker === conversation.participants[0] ? "bg-primary/10" : "bg-white/10")}`}
            >
              <p className="font-semibold mb-1 text-white">{turn.speaker}:</p>
              {isMyTurn ? (
                <p className="text-lg italic text-gray-300">Tu turno...</p>
              ) : (
                <>
                  <p className="text-lg mb-2 text-white">{turn.en}</p>
                  <p className="text-gray-300 text-sm italic">{turn.es}</p>
                  <button
                    onClick={() => handlePlayTurn(turn)}
                    className="mt-3 px-3 py-1 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
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
