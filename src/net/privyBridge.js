/**
 * Island de React AISLADO para Privy. Es el ÚNICO punto donde el juego (vanilla)
 * toca React: se carga de forma diferida (dynamic import) solo cuando el jugador
 * decide iniciar sesión, así el bundle base sigue sin React.
 *
 * mountPrivy(container, { appId, onChange }) monta un PrivyProvider con un
 * componente puente que expone login/logout/getAccessToken al lado vanilla y
 * reporta los cambios de sesión por onChange. Sin JSX (createElement) para no
 * tocar la config de build de Vite.
 */
import { createElement as h, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { PrivyProvider, usePrivy } from '@privy-io/react-auth';

export function mountPrivy(container, { appId, onChange }) {
  // Objeto de control que el lado vanilla usa; el componente lo rellena cuando
  // los hooks de Privy están listos.
  const controls = {
    login: () => {},
    logout: () => {},
    getAccessToken: async () => null,
  };

  function Bridge() {
    const p = usePrivy();
    useEffect(() => {
      controls.login = p.login;
      controls.logout = p.logout;
      controls.getAccessToken = p.getAccessToken;
      onChange({ ready: p.ready, authenticated: p.authenticated, user: p.user || null });
    }, [p.ready, p.authenticated, p.user]);
    return null;
  }

  const root = createRoot(container);
  root.render(
    h(
      PrivyProvider,
      {
        appId,
        config: {
          // La lista real de métodos se controla en el dashboard de Privy; aquí
          // solo damos apariencia acorde al juego (oscuro + amarillo Bombazo).
          appearance: { theme: 'dark', accentColor: '#ffd100', showWalletLoginFirst: false },
          embeddedWallets: { createOnLogin: 'off' },
        },
      },
      h(Bridge)
    )
  );
  return controls;
}
