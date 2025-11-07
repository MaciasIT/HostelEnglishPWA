import { describe, it, vi, expect, beforeEach } from 'vitest';

// Mock global objects for service worker
const originalNavigator = global.navigator;
const originalAddEventListener = global.window.addEventListener;

describe('Service Worker Registration', () => {
  let registerMock: ReturnType<typeof vi.fn>;
  let addEventListenerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    registerMock = vi.fn(() => Promise.resolve({ scope: '/' }));
    addEventListenerMock = vi.fn((event, cb) => {
      if (event === 'load') cb();
    });
    // @ts-ignore
    global.navigator = { serviceWorker: { register: registerMock } };
    global.window.addEventListener = addEventListenerMock;
    vi.resetModules();
  });

  afterEach(() => {
    global.navigator = originalNavigator;
    global.window.addEventListener = originalAddEventListener;
  });

  it('registra el service worker al cargar la página', async () => {
    await import('../src/registerServiceWorker');
    expect(addEventListenerMock).toHaveBeenCalledWith('load', expect.any(Function));
    expect(registerMock).toHaveBeenCalledWith('/sw.js');
  });

  it('muestra mensaje de éxito en consola si el registro es correcto', async () => {
    const logSpy = vi.spyOn(console, 'log');
    await import('../src/registerServiceWorker');
    // Espera a que la promesa se resuelva
    await Promise.resolve();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('Service Worker registrado con éxito'),
      expect.objectContaining({ scope: '/' })
    );
    logSpy.mockRestore();
  });

  it('muestra error en consola si el registro falla', async () => {
    registerMock = vi.fn(() => Promise.reject('error de registro'));
    // @ts-ignore
    global.navigator = { serviceWorker: { register: registerMock } };
    const errorSpy = vi.spyOn(console, 'error');
    await import('../src/registerServiceWorker');
    // Espera a que la promesa se resuelva
    await Promise.resolve();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error al registrar el Service Worker'),
      'error de registro'
    );
    errorSpy.mockRestore();
  });
});
