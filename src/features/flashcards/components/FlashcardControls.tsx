interface FlashcardControlsProps {
  onNext: () => void;
  onPrev: () => void;
  onShuffle: () => void;
}

export default function FlashcardControls({ onNext, onPrev, onShuffle }: FlashcardControlsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 w-full mb-12">
      <button
        onClick={onPrev}
        className="p-4 bg-surface/5 border border-border/10 rounded-2xl text-primary font-bold hover:bg-surface/10 active:scale-95 transition-all text-sm uppercase tracking-tighter"
        aria-label="Ir a la tarjeta anterior"
      >
        Anterior
      </button>
      <button
        onClick={onShuffle}
        className="p-4 bg-accent text-primary rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg text-sm uppercase tracking-tighter"
        aria-label="Mezclar mazo aleatoriamente"
      >
        Mezclar
      </button>
      <button
        onClick={onNext}
        className="p-4 bg-surface/5 border border-border/10 rounded-2xl text-primary font-bold hover:bg-surface/10 active:scale-95 transition-all text-sm uppercase tracking-tighter"
        aria-label="Ir a la siguiente tarjeta"
      >
        Siguiente
      </button>
    </div>
  );
}
