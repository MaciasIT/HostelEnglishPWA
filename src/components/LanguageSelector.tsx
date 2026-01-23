import React from 'react';
import { useAppStore } from '@/store/useAppStore';

const LanguageSelector: React.FC = () => {
    const { targetLanguage, setTargetLanguage } = useAppStore((state) => ({
        targetLanguage: state.prefs.targetLanguage,
        setTargetLanguage: state.setTargetLanguage,
    }));

    const languages = [
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'eu', label: 'Euskera', flag: '🏳️' }, // Using white flag or Basque flag if compatible
    ];

    return (
        <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl w-full">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => setTargetLanguage(lang.code as 'en' | 'eu')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${targetLanguage === lang.code
                            ? 'bg-accent text-white shadow-lg'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
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
