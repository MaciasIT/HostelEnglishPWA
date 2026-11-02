import { describe, it, vi, expect, beforeEach } from 'vitest';
import { initNotifications } from '../src/pushNotifications';

describe('Notificaciones Push', () => {
  let permissionMock: 'default' | 'granted' | 'denied' = 'default';
  let requestPermissionMock: ReturnType<typeof vi.fn>;
  let NotificationMock: any;

  beforeEach(() => {
    requestPermissionMock = vi.fn(() => Promise.resolve(permissionMock));
    NotificationMock = vi.fn(function () {
      // Simula el constructor de Notification
    });
    NotificationMock.permission = permissionMock;
    NotificationMock.requestPermission = requestPermissionMock;
    // @ts-ignore
    global.Notification = NotificationMock;
    vi.resetModules();
    // Use vi.stubGlobal for session storage
    vi.stubGlobal('sessionStorage', {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0
    });
  });

  it('solicita permiso de notificaciones si no está concedido', async () => {
    permissionMock = 'default';
    NotificationMock.permission = permissionMock;
    initNotifications();
    expect(requestPermissionMock).toHaveBeenCalled();
  });

  it('no solicita permiso si ya está concedido', async () => {
    permissionMock = 'granted';
    NotificationMock.permission = permissionMock;
    initNotifications();
    expect(requestPermissionMock).not.toHaveBeenCalled();
  });

  it('muestra una notificación si el permiso está concedido', async () => {
    permissionMock = 'granted';
    NotificationMock.permission = permissionMock;
    initNotifications();
    expect(NotificationMock).toHaveBeenCalledWith(
      expect.stringContaining('¡Bienvenido a HostelEnglish!'),
      expect.objectContaining({ body: expect.any(String) })
    );
  });

  it('en móvil usa showNotification del Service Worker sin new Notification', async () => {
    permissionMock = 'granted';
    NotificationMock.permission = permissionMock;
    NotificationMock.mockImplementation(function () {
      throw new TypeError('Illegal constructor');
    });
    const showNotification = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', {
      serviceWorker: { getRegistration: vi.fn(() => Promise.resolve({ showNotification })) },
    });
    expect(() => initNotifications()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
    expect(showNotification).toHaveBeenCalled();
    expect(NotificationMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('no lanza aunque new Notification falle', async () => {
    permissionMock = 'granted';
    NotificationMock.permission = permissionMock;
    NotificationMock.mockImplementation(function () {
      throw new TypeError('Illegal constructor');
    });
    expect(() => initNotifications()).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});
