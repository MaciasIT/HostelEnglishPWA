/**
 * Service to handle browser push notifications.
 * Encapsulates permission requests and notification triggering.
 * Fully resilient on mobile browsers (Android / iOS) where `new Notification()` throws.
 */

export const initNotifications = (): void => {
    try {
        if (typeof window === 'undefined' || !('Notification' in window)) return;

        const showWelcome = async () => {
            try {
                const title = '¡Bienvenido a HostelEnglish!';
                const options: NotificationOptions = {
                    body: 'Recibe novedades y recordatorios para mejorar tu inglés.',
                    icon: '/favicon.ico'
                };

                // En móviles Android/iOS, 'new Notification()' lanza TypeError: Illegal constructor.
                // La vía estándar y segura es ServiceWorkerRegistration.showNotification().
                if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
                    try {
                        const reg = await navigator.serviceWorker.getRegistration();
                        if (reg && reg.showNotification) {
                            await reg.showNotification(title, options);
                            return;
                        }
                    } catch {}
                }

                // Fallback para entornos donde el constructor de Notification sí es legal (desktop/tests)
                try {
                    new Notification(title, options);
                } catch {
                    // Silencioso en navegadores móviles que rechazan new Notification()
                }
            } catch (err) {
                console.warn('[pushNotifications] No se pudo mostrar la notificación:', err);
            }
        };

        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    void showWelcome();
                }
            }).catch(() => {});
        } else if (Notification.permission === 'granted') {
            try {
                const hasShown = sessionStorage.getItem('welcome_notification_shown');
                if (!hasShown) {
                    sessionStorage.setItem('welcome_notification_shown', 'true');
                    void showWelcome();
                }
            } catch {
                void showWelcome();
            }
        }
    } catch (err) {
        console.warn('[pushNotifications] Error inicializando notificaciones:', err);
    }
};

