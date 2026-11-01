import { describe, it, expect } from 'vitest';
import {
  estimateTokens,
  estimateMessageTokens,
  truncateMessagesToContextWindow,
} from './contextWindow';
import type { LLMChatMessage } from './llmTypes';

describe('estimateTokens', () => {
  it('devuelve 0 para texto vacío', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estima ~1 token por 3.5 caracteres (sobre-dimensiona)', () => {
    // "Hello" (5 chars) → ceil(5/3.5) = 2
    expect(estimateTokens('Hello')).toBe(2);
    // 35 chars → ceil(10) = 10
    expect(estimateTokens('a'.repeat(35))).toBe(10);
  });

  it('nunca devuelve menos de 1 token', () => {
    expect(estimateTokens('a')).toBe(1);
  });
});

describe('estimateMessageTokens', () => {
  it('suma la sobrecarga por cabecera de mensaje', () => {
    const message: LLMChatMessage = { role: 'user', content: 'Hello' };
    expect(estimateMessageTokens(message)).toBe(estimateTokens('Hello') + 4);
  });
});

describe('truncateMessagesToContextWindow', () => {
  const system: LLMChatMessage = {
    role: 'system',
    content: 'You are a hotel customer. Speak B1-B2 English.',
  };
  const turns: LLMChatMessage[] = [
    system,
    { role: 'user', content: 'Good evening, welcome to the hotel.' },
    { role: 'assistant', content: 'Hello, I have a reservation under Smith.' },
    { role: 'user', content: 'Let me check the system for you.' },
  ];

  it('conserva todos los mensajes cuando caben en la ventana', () => {
    const result = truncateMessagesToContextWindow(turns, 1024, 256);
    // Menos de 100 tokens: deben sobrevivir todos.
    expect(result).toHaveLength(4);
    expect(result[0].role).toBe('system');
  });

  it('conserva siempre el mensaje system incluso con ventana mínima', () => {
    const result = truncateMessagesToContextWindow(turns, 40, 10);
    expect(result[0].role).toBe('system');
  });

  it('recorta los mensajes más antiguos cuando excede el presupuesto', () => {
    const longMessages: LLMChatMessage[] = [
      system,
      { role: 'user', content: 'old message that should be dropped '.repeat(30) },
      { role: 'assistant', content: 'old reply that should be dropped '.repeat(30) },
      { role: 'user', content: 'recent question' },
    ];
    const result = truncateMessagesToContextWindow(longMessages, 300, 100);

    const joined = result.map((m) => m.content).join(' ');
    // El turno reciente debe sobrevivir.
    expect(joined).toContain('recent question');
    // El mensaje más antiguo de usuario debe haberse descartado.
    expect(joined).not.toContain('old message that should be dropped '.repeat(15));
  });

  it('preserva el orden cronológico original', () => {
    const result = truncateMessagesToContextWindow(turns, 1024, 256);
    const roles = result.map((m) => m.role);
    expect(roles).toEqual(['system', 'user', 'assistant', 'user']);
  });

  it('garantiza la presencia del último turno del usuario truncándolo si hace falta', () => {
    const lastUser: LLMChatMessage = {
      role: 'user',
      content: 'the final question that absolutely must survive truncation '.repeat(40),
    };
    const messages: LLMChatMessage[] = [
      system,
      { role: 'user', content: 'first question '.repeat(100) },
      { role: 'assistant', content: 'first answer '.repeat(100) },
      lastUser,
    ];
    const result = truncateMessagesToContextWindow(messages, 200, 50);
    // El último mensaje (rol user) debe estar presente al final.
    expect(result[result.length - 1].role).toBe('user');
  });
});