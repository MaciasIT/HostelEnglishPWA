// pushNotifications.ts
// Lógica base para solicitar permiso y mostrar una notificación de bienvenida

if ('Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification('¡Bienvenido a HostelEnglish!', {
          body: 'Recibe novedades y recordatorios para mejorar tu inglés.'
        });
      }
    });
  } else if (Notification.permission === 'granted') {
    new Notification('¡Bienvenido a HostelEnglish!', {
      body: 'Recibe novedades y recordatorios para mejorar tu inglés.'
    });
  }
}

export {};
