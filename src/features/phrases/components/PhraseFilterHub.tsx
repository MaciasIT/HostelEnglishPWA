import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import VoiceSettings from '@/components/VoiceSettings';
import { useSmoothFocusScroll } from '@/hooks/useSmoothFocusScroll';

interface PhraseFilterHubProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  phraseSettings: any;
  onPhraseSettingChange: (setting: string, value: any) => void;
}

export default function PhraseFilterHub({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  phraseSettings,
  onPhraseSettingChange
}: PhraseFilterHubProps) {
  const handleFocusScroll = useSmoothFocusScroll();
  return (
    <div className="bg-surface/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/10 shadow-2xl relative overflow-hidden" role="search">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent opacity-5 blur-2xl rounded-full" aria-hidden="true"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary group-hover:text-accent-text transition-colors" />
          <input
            type="text"
            placeholder="Buscar frase..."
            onFocus={handleFocusScroll}
            className="w-full pl-12 pr-4 py-4 bg-surface/5 border border-border/10 rounded-2xl text-primary placeholder-gray-500 focus:ring-2 focus:ring-accent outline-none transition-all font-bold"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar en la biblioteca de frases"
          />
        </div>
        
        <div className="relative group">
          <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary group-hover:text-accent-text transition-colors" />
          <select
            className="w-full pl-12 pr-10 py-4 bg-surface/5 border border-border/10 rounded-2xl text-primary appearance-none focus:ring-2 focus:ring-accent outline-none transition-all font-bold cursor-pointer"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filtrar por categoría o estado"
          >
            <option value="all" className="bg-surface">Todas las frases</option>
            <optgroup label="Estado de Aprendizaje" className="bg-surface text-accent-text">
              <option value="Nuevas" className="bg-surface">Nuevas (Sin estudiar)</option>
              <option value="Estudiadas" className="bg-surface">Estudiadas (Nivel 1)</option>
              <option value="Aprendidas" className="bg-surface">Aprendidas (Nivel 2)</option>
            </optgroup>
            <optgroup label="Categorías" className="bg-surface text-accent-text">
              {categories.map(category => {
                let label = category;
                const mapping: Record<string, string> = {
                  'Jatetxea': 'Restaurante',
                  'Harrera': 'Recepción',
                  'Kexak': 'Quejas',
                  'Kexak eta erreklamazioak': 'Quejas y Reclamaciones'
                };
                return (
                  <option key={category} value={category} className="bg-surface">
                    {mapping[category] || label}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <VoiceSettings
          settings={phraseSettings}
          onSettingChange={onPhraseSettingChange}
          showTitle={false}
        />
      </div>
    </div>
  );
}
