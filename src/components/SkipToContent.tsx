import React from 'react';

export const MAIN_CONTENT_ID = 'main-content';

/**
 * Enlace "Saltar al contenido": primer elemento tabulable de la página.
 * Oculto visualmente hasta recibir foco por teclado.
 *
 * La app usa HashRouter, así que un `href="#main-content"` nativo cambiaría
 * la ruta. Por eso se intercepta el clic y se mueve el foco al <main>.
 */
const SkipToContent: React.FC = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(MAIN_CONTENT_ID);
    if (target) {
      target.focus();
      target.scrollIntoView?.({ block: 'start' });
    }
  };

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-5 focus:py-3 focus:rounded-xl focus:bg-accent focus:text-on-accent focus:font-bold focus:shadow-lg focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
    >
      Saltar al contenido principal
    </a>
  );
};

export default SkipToContent;
