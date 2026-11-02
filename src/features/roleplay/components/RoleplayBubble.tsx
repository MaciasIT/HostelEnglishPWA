interface RoleplayBubbleProps {
  role: 'user' | 'client';
  text: string;
  speakerLabel?: string;
}

/**
 * Burbuja de conversación del chat de roleplay. El cliente (IA) se alinea a la
 * izquierda; el alumno a la derecha.
 */
export default function RoleplayBubble({ role, text, speakerLabel }: RoleplayBubbleProps) {
  const isClient = role === 'client';
  return (
    <div className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}>
      <div
        className={`max-w-[80%] rounded-3xl px-5 py-3 shadow-sm ${
          isClient
            ? 'bg-surface border border-border/15 rounded-bl-md'
            : 'bg-accent text-on-accent rounded-br-md'
        }`}
      >
        {speakerLabel && (
          <p
            className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${
              isClient ? 'text-accent-text' : 'text-on-accent/80'
            }`}
          >
            {speakerLabel}
          </p>
        )}
        <p className="text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}