import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import VoiceSettings from '@/components/VoiceSettings';
import CollapsibleSection from '@/components/CollapsibleSection';

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
  return (
    <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden" role="search">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent opacity-5 blur-2xl rounded-full" aria-hidden="true"></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-hover:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Buscar frase..."
            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:ring-2 focus:ring-accent outline-none transition-all font-bold"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar en la biblioteca de frases"
          />
        </div>
        
        <div className="relative group">
          <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-hover:text-accent transition-colors" />
          <select
            className="w-full pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-white appearance-none focus:ring-2 focus:ring-accent outline-none transition-all font-bold cursor-pointer"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label="Filtrar por categoría o estado"
          >
            <option value="all" className="bg-primary-dark">Todas las frases</option>
            <optgroup label="Estado de Aprendizaje" className="bg-primary-dark text-accent">
              <option value="Nuevas" className="bg-primary-dark">Nuevas (Sin estudiar)</option>
              <option value="Estudiadas" className="bg-primary-dark">Estudiadas (Nivel 1)</option>
              <option value="Aprendidas" className="bg-primary-dark">Aprendidas (Nivel 2)</option>
            </optgroup>
            <optgroup label="Categorías" className="bg-primary-dark text-accent">
              {categories.map(category => {
                let label = category;
                const mapping: Record<string, string> = {
                  'Jatetxea': 'Restaurante',
                  'Harrera': 'Recepción',
                  'Kexak': 'Quejas',
                  'Kexak eta erreklamazioak': 'Quejas y Reclamaciones'
                };
                return (
                  <option key={category} value={category} className="bg-primary-dark">
                    {mapping[category] || label}
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <CollapsibleSection title="Ajustes de Voz">
          <div className="pt-4">
            <VoiceSettings 
              settings={phraseSettings} 
              onSettingChange={onPhraseSettingChange} 
              showTitle={false} 
            />
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
