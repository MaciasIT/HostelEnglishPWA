/**
 * Service to handle browser push notifications.
 * Encapsulates permission requests and notification triggering.
 */

export const initNotifications = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const showWelcome = () => {
        new Notification('¡Bienvenido a HostelEnglish!', {
            body: 'Recibe novedades y recordatorios para mejorar tu inglés.',
            icon: '/favicon.ico' // Adding icon for better UX
        });
    };

    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showWelcome();
            }
        });
    } else if (Notification.permission === 'granted') {
        // Optional: Avoid re-showing on every reload if already granted
        // For now we keep it as requested to see it works, 
        // but normally we'd check a flag in localStorage
        const hasShown = sessionStorage.getItem('welcome_notification_shown');
        if (!hasShown) {
            showWelcome();
            sessionStorage.setItem('welcome_notification_shown', 'true');
        }
    }
};
