import React from 'react';

type PhraseCardProps = {
  phrase: { es: string; en: string; audioEs?: string; audioEn?: string; id: string };
  onToggleStudied: (id: string) => void;
  isStudied: boolean;
  onPlayAudio: (lang: 'es' | 'en', audioUrl?: string) => void;
};

const PhraseCard: React.FC<PhraseCardProps> = ({
  phrase,
  onToggleStudied,
  isStudied,
  onPlayAudio,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <p className="text-gray-900 dark:text-white text-lg font-semibold mb-2">{phrase.es}</p>
      <p className="text-gray-600 dark:text-gray-300 text-md mb-4">{phrase.en}</p>
      <div className="flex justify-between items-center">
        <div>
          <button
            onClick={() => onPlayAudio('es', phrase.audioEs)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md mr-2"
          >
            Audio ES
          </button>
          <button
            onClick={() => onPlayAudio('en', phrase.audioEn)}
            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md"
          >
            Audio EN
          </button>
        </div>
        <button
          onClick={() => onToggleStudied(phrase.id)}
          className={`px-3 py-1 rounded-md ${isStudied
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}
        >
          {isStudied ? 'Estudiada' : 'Marcar como estudiada'}
        </button>
      </div>
    </div>
  );
};

export default PhraseCard;
