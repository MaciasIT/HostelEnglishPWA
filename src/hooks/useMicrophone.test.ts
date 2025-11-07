import { describe, it, vi, expect, beforeEach } from 'vitest';

describe('Permiso de micrófono', () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;
  let originalMediaDevices: any;

  beforeEach(() => {
    getUserMediaMock = vi.fn(() => Promise.resolve('stream'));
    originalMediaDevices = navigator.mediaDevices;
    // @ts-ignore
    navigator.mediaDevices = { getUserMedia: getUserMediaMock };
    vi.resetModules();
  });

  afterEach(() => {
    // @ts-ignore
    navigator.mediaDevices = originalMediaDevices;
  });

  it('solicita permiso de micrófono al usuario', async () => {
    const { requestMicrophonePermission } = await import('../src/hooks/useMicrophone');
    await requestMicrophonePermission();
    expect(getUserMediaMock).toHaveBeenCalledWith({ audio: true });
  });

  it('devuelve true si el usuario concede el permiso', async () => {
    const { requestMicrophonePermission } = await import('../src/hooks/useMicrophone');
    const result = await requestMicrophonePermission();
    expect(result).toBe(true);
  });

  it('devuelve false si el usuario deniega el permiso', async () => {
    getUserMediaMock = vi.fn(() => Promise.reject('denegado'));
    // @ts-ignore
    navigator.mediaDevices = { getUserMedia: getUserMediaMock };
    const { requestMicrophonePermission } = await import('../src/hooks/useMicrophone');
    const result = await requestMicrophonePermission();
    expect(result).toBe(false);
  });
});
