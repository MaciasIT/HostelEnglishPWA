import React from 'react';
import { useAppStore, useShallow } from '@/store/useAppStore';

const LanguageSelector: React.FC = () => {
    const { targetLanguage, setTargetLanguage } = useAppStore(
      useShallow((state) => ({
        targetLanguage: state.prefs.targetLanguage,
        setTargetLanguage: state.setTargetLanguage,
      })),
    );

    const languages = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'eu', label: 'Euskera', flag: '🏳️' },
    ];

    return (
        <div className="flex bg-surface/5 border border-border/10 p-1 rounded-2xl w-full" role="radiogroup" aria-label="Idioma de aprendizaje">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => setTargetLanguage(lang.code as 'en' | 'eu')}
                    role="radio"
                    aria-checked={targetLanguage === lang.code}
                    aria-label={`Aprender en ${lang.label}`}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${targetLanguage === lang.code
                            ? 'bg-accent text-primary shadow-lg'
                            : 'text-tertiary hover:text-primary hover:bg-surface/5'
                        }`}
                >
                    <span className="text-sm">{lang.flag}</span>
                    {lang.label}
                </button>
            ))}
        </div>
    );
};

export default LanguageSelector;
