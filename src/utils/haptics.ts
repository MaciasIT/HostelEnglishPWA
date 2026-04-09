/**
 * Haptic feedback utility for PWA mobile experience.
 * Provides subtle vibration feedback on action completion.
 * Falls back silently if the Vibration API is not available.
 */
export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light'): void => {
  if ('vibrate' in navigator) {
    const patterns: Record<string, number[]> = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    };
    navigator.vibrate(patterns[type]);
  }
};
