import { useState, useEffect } from 'react';

export function useTestHook({ value = 0 }: { value?: number }) {
  const [state, setState] = useState(value);
  useEffect(() => {
    setState(value);
  }, [value]);
  return { state, setState };
}
