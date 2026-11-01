import useAudioControl from '@/hooks/useAudioControl';
import { describe, it, expect } from 'vitest';

describe('useAudioControl', () => {
  it('should import', () => {
    expect(typeof useAudioControl).toBe('function');
  });
});
