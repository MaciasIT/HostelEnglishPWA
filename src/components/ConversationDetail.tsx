import React from 'react';
import { useAudio } from '@/hooks/useAudio';
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
  turns: ConversationTurn[];
};

interface ConversationDetailProps {
  conversation: Conversation;
  onBack: () => void;
}

const ConversationDetail: React.FC<ConversationDetailProps> = ({ conversation, onBack }) => {
  const { playAudio } = useAudio();
  const audioSpeed = useAppStore((state) => state.prefs.audioSpeed);

  const handlePlayTurn = (turn: ConversationTurn) => {
    if (turn.audio) {
      playAudio(`/audio/${turn.audio}`, audioSpeed);
    } else {
      playAudio(turn.english, audioSpeed, true); // Fallback to TTS
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

      <div className="space-y-6">
        {conversation.turns.map((turn, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg shadow-md ${turn.speaker === "Hostel Staff" ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100" : "bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100"}`}
          >
            <p className="font-semibold mb-1">{turn.speaker}:</p>
            <p className="text-lg mb-2">{turn.english}</p>
            <p className="text-gray-700 dark:text-gray-300 text-sm italic">{turn.spanish}</p>
            <button
              onClick={() => handlePlayTurn(turn)}
              className="mt-3 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Reproducir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationDetail;
