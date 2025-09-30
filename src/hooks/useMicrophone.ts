// Hook para solicitar permiso de micrófono
export async function requestMicrophonePermission(): Promise<boolean> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return false;
  }
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (e) {
    return false;
  }
}
