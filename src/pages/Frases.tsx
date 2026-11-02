import { useState, useEffect, useMemo } from 'react';
import { useAppStore, useShallow } from '@/store/useAppStore';
import PhraseCard from '@/components/PhraseCard';
import VoiceSettings from '@/components/VoiceSettings';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  AcademicCapIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { shuffle } from '@/utils/shuffle';
import PageContainer from '@/components/layout/PageContainer';
import ModuleIntro from '@/components/ModuleIntro';
import RoleScopeTabs, { type RoleScope } from '@/components/RoleScopeTabs';
import CategoryChips, { emojiForCategory } from '@/components/CategoryChips';
import { roleMatchesCategory } from '@/utils/roleFilter';

export default function Frases() {
  const {
    frases,
    loadFrases,
    progress,
    advancePhraseProgress,
    categories,
    setActivePhraseSet,
  } = useAppStore();

  const { phraseSettings, setPhraseSetting } = useAppStore(
    useShallow((state) => ({
      phraseSettings: state.prefs.phraseSettings,
      setPhraseSetting: state.setPhraseSetting,
    })),
  );


  const [searchTerm, setSearchTerm] = useState('');
  const selectedRole = useAppStore((state) => state.prefs.selectedRole);
  const [scope, setScope] = useState<RoleScope>('role');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activePhrases, setActivePhrases] = useState<any[]>([]);

  useEffect(() => {
    if (frases.length === 0) loadFrases();
    return () => window.speechSynthesis.cancel();
  }, [frases.length, loadFrases]);



  const filteredFrases = useMemo(() => {
    return frases.filter(phrase => {
      const phraseEs = phrase.es || '';
      const phraseEn = phrase.en || '';
      const phraseEu = phrase.eu || '';
      const matchesSearch = phraseEs.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phraseEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phraseEu.toLowerCase().includes(searchTerm.toLowerCase());

      const progressLevel = progress[phrase.id] || 0;
      let matchesCategory = false;

      switch (selectedCategory) {
        case 'all':
          matchesCategory = true;
          break;
        case 'Nuevas':
          matchesCategory = progressLevel === 0;
          break;
        case 'Estudiadas':
          matchesCategory = progressLevel === 1;
          break;
        case 'Aprendidas':
          matchesCategory = progressLevel === 2;
          break;
        default:
          matchesCategory = phrase.categoria === selectedCategory;
          break;
      }

      const matchesRole = scope === 'all' || roleMatchesCategory(selectedRole, phrase.categoria);

      return matchesCategory && matchesSearch && matchesRole;
    });
  }, [frases, searchTerm, selectedCategory, progress, scope, selectedRole]);

  const startStudySession = (size: number | 'all') => {
    const phrasesToStudy = shuffle([...filteredFrases]);
    const sessionSize = size === 'all' ? phrasesToStudy.length : size;
    const subset = phrasesToStudy.slice(0, sessionSize);
    setActivePhrases(subset);
    setActivePhraseSet(subset);
    setCurrentIndex(0);
    setIsSessionActive(true);
  };

  const endStudySession = () => {
    setIsSessionActive(false);
    setActivePhraseSet([]);
    setCurrentIndex(0);
  };

  if (showWelcome) {
    return (
      <PageContainer>
        <ModuleIntro
          title="Módulo de Frases"
          description="Domina las expresiones más importantes del sector. Filtra por situaciones específicas y entrena tu memoria."
          icon={AcademicCapIcon}
          onStart={() => setShowWelcome(false)}
          stats={[
            { label: 'Colección', value: frases.length },
            { label: 'Categorías', value: categories.length },
            { label: 'Tu Nivel', value: Object.keys(progress).length }
          ]}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Biblioteca de Frases">
      <div className={`max-w-4xl mx-auto space-y-8 ${isSessionActive ? 'animate-fade-in' : ''}`}>

        {!isSessionActive && (
          <div className="space-y-6">
            <div className="bg-surface/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-border/10 shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-accent opacity-5 blur-2xl rounded-full"></div>
              <RoleScopeTabs role={selectedRole} scope={scope} onChange={setScope} />

              <div className="grid grid-cols-1 gap-6">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
                  <input
                    type="text"
                    placeholder="Buscar frase..."
                    className="w-full pl-12 pr-4 py-4 bg-surface/5 border border-border/10 rounded-2xl text-primary placeholder-gray-500 focus:ring-2 focus:ring-accent outline-none transition-all font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <CategoryChips
                ariaLabel="Filtrar por categoría"
                className="mt-2"
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: 'all', label: 'Todas las frases', emoji: '🌐' },
                  { value: 'Nuevas', label: 'Nuevas', emoji: '✨' },
                  ...categories.map((category) => {
                    const labels: Record<string, string> = {
                      Jatetxea: 'Restaurante',
                      Harrera: 'Recepción',
                      Kexak: 'Quejas',
                      'Kexak eta erreklamazioak': 'Quejas y Reclamaciones',
                    };
                    return { value: category, label: labels[category] ?? category, emoji: emojiForCategory(category) };
                  }),
                ]}
              />

              <div className="mt-6">
                <VoiceSettings settings={phraseSettings} onSettingChange={setPhraseSetting} showTitle={false} />
              </div>
            </div>

            {/* Selection/Session Builder */}
            <div className="bg-surface/10 p-5 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-border/20 shadow-2xl text-center relative overflow-hidden">
              {filteredFrases.length > 0 ? (
                <>
                  <h3 className="text-2xl sm:text-3xl font-black text-primary mb-2">¿Listo para practicar?</h3>
                  <p className="text-tertiary mb-6 sm:mb-10 text-sm sm:text-base">Hemos encontrado <span className="text-accent font-bold">{filteredFrases.length}</span> frases según tus filtros.</p>

                  <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                    {[10, 25, 'all'].map(size => (
                      <button
                        key={size}
                        onClick={() => startStudySession(size as any)}
                        className={`px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-wider sm:tracking-widest transition-all active:scale-95 shadow-xl flex items-center gap-2 text-sm sm:text-base ${size === 'all' ? 'bg-accent text-primary' : 'bg-surface/10 text-primary hover:bg-surface/20'}`}
                      >
                        <PlayIcon className="w-5 h-5" />
                        {size === 'all' ? 'Todas' : size}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-10">
                  <XMarkIcon className="w-16 h-16 text-secondary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-primary mb-2">No hay frases para este filtro</h3>
                  <p className="text-tertiary mb-8">Prueba a cambiar la categoría o limpiar la búsqueda.</p>
                  <button
                    onClick={() => { setSelectedCategory('all'); setSearchTerm(''); }}
                    className="text-accent font-black uppercase tracking-widest text-sm hover:underline"
                  >
                    Ver todas las nuevas
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isSessionActive && activePhrases[currentIndex] && (
          <div className="space-y-10">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={endStudySession}
                className="p-3 bg-surface/5 border border-border/10 rounded-2xl text-tertiary hover:text-primary transition-all active:scale-90"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <div className="px-6 py-2 bg-surface/5 border border-border/10 rounded-full">
                <span className="text-primary font-black">{currentIndex + 1}</span>
                <span className="text-tertiary font-bold mx-2">/</span>
                <span className="text-tertiary font-bold">{activePhrases.length}</span>
              </div>
              <div className="w-12"></div>
            </div>

            <div className="animate-in zoom-in-95 duration-500">
              <PhraseCard
                phrase={activePhrases[currentIndex]}
                onAdvanceProgress={advancePhraseProgress}
                progressLevel={progress[activePhrases[currentIndex].id] || 0}
              />
            </div>

            <div className="flex justify-center items-center gap-6">
              <button
                onClick={() => setCurrentIndex(prev => (prev - 1 + activePhrases.length) % activePhrases.length)}
                className="p-6 bg-surface/5 border border-border/10 rounded-full text-primary hover:bg-surface/10 active:scale-90 transition-all shadow-xl"
                aria-label="Frase anterior"
              >
                <ArrowLeftIcon className="w-8 h-8" />
              </button>
              <button
                onClick={() => setCurrentIndex(prev => (prev + 1) % activePhrases.length)}
                className="p-6 bg-accent border border-accent rounded-full text-primary hover:brightness-110 active:scale-90 transition-all shadow-xl"
                aria-label="Siguiente frase"
              >
                <ArrowRightIcon className="w-8 h-8" />
              </button>
            </div>

            <p className="text-center text-xs text-tertiary uppercase tracking-widest font-semibold">
              Desliza o usa las flechas para navegar
            </p>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
