import { describe, it, vi, expect, beforeEach } from 'vitest';

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
  });

  it('solicita permiso de notificaciones si no está concedido', async () => {
    permissionMock = 'default';
    NotificationMock.permission = permissionMock;
    await import('../src/pushNotifications');
    expect(requestPermissionMock).toHaveBeenCalled();
  });

  it('no solicita permiso si ya está concedido', async () => {
    permissionMock = 'granted';
    NotificationMock.permission = permissionMock;
    await import('../src/pushNotifications');
    expect(requestPermissionMock).not.toHaveBeenCalled();
  });

  it('muestra una notificación si el permiso está concedido', async () => {
    permissionMock = 'granted';
    NotificationMock.permission = permissionMock;
    await import('../src/pushNotifications');
    expect(NotificationMock).toHaveBeenCalledWith(
      expect.stringContaining('¡Bienvenido a HostelEnglish!'),
      expect.objectContaining({ body: expect.any(String) })
    );
  });
});
