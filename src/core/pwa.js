/**
 * Instalación como app (PWA). Captura el evento beforeinstallprompt para
 * ofrecer un botón propio de "Instalar" cuando el navegador lo permite.
 * En navegadores sin soporte (p.ej. iOS Safari) el botón no aparece.
 */
let deferred = null;
let notify = null;

export function initInstallPrompt(onAvailable) {
  notify = onAvailable;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    notify?.(true);
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify?.(false);
  });
}

export function canInstall() {
  return Boolean(deferred);
}

/** Lanza el diálogo nativo de instalación. Devuelve true si aceptó. */
export async function promptInstall() {
  if (!deferred) return false;
  deferred.prompt();
  const choice = await deferred.userChoice;
  deferred = null;
  notify?.(false);
  return choice.outcome === 'accepted';
}
