// Este archivo registra el service worker generado por VitePWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      registration => {
        console.log('Service Worker registrado con éxito:', registration);
      },
      error => {
        console.error('Error al registrar el Service Worker:', error);
      }
    );
  });
}

export {};
