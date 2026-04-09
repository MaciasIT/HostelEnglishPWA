export type Phrase = {
  id: number | string;
  es: string;
  en: string;
  eu?: string;
  categoria?: string;
};

export type ConversationTurn = {
  speaker: string;
  en: string;
  es: string;
  eu?: string;
  audio?: string;
};

export type Conversation = {
  id: number;
  title: string;
  description: string;
  dialogue: ConversationTurn[];
  categoria?: string;
  participants: string[];
};

export type ExamResult = {
  date: string;
  score: number;
  total: number;
};

export type AppPrefs = {
  targetLanguage: 'en' | 'eu';
  theme: string;
  audioSpeed: number;
  conversationSettings: {
    [participant: string]: {
      voiceURI: string;
      rate: number;
      pitch: number;
    };
  };
  phraseSettings: {
    voiceURI: string;
    rate: number;
    pitch: number;
  };
};
