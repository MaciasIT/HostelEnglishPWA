import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTestHook } from '@/hooks/useTestHook';

describe('useTestHook', () => {
  it('should render hook', () => {
    const { result } = renderHook(() => useTestHook({ value: 1 }));
    expect(result.current.state).toBe(1);
  });
});
