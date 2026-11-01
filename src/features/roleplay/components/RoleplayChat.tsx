import { useEffect, useRef } from 'react';
import RoleplayBubble from './RoleplayBubble';
import type { RoleplayTurn } from '../stateMachine';

interface RoleplayChatProps {
  turns: RoleplayTurn[];
  clientLabel: string;
  userLabel: string;
  typing?: boolean;
  emptyHint?: string;
}

/**
 * Lista de burbujas con auto-scroll al último turno. Region `log` + `aria-live`
 * para que los lectores de pantalla anuncien cada turno.
 */
export default function RoleplayChat({
  turns,
  clientLabel,
  userLabel,
  typing = false,
  emptyHint,
}: RoleplayChatProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [turns.length, typing]);

  return (
    <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
      <div role="log" aria-live="polite" aria-label="Conversación de roleplay" className="space-y-4">
        {turns.length === 0 && emptyHint && (
          <p className="text-tertiary text-center text-sm italic py-8">{emptyHint}</p>
        )}
        {turns.map((turn, idx) => (
          <RoleplayBubble
            key={`${turn.role}-${idx}`}
            role={turn.role}
            text={turn.text}
            speakerLabel={turn.role === 'client' ? clientLabel : userLabel}
          />
        ))}
        {typing && <RoleplayBubble role="client" text="…" speakerLabel={clientLabel} />}
      </div>
      <div ref={endRef} aria-hidden="true" />
    </div>
  );
}