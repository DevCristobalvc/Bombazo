/** Crea un elemento DOM a partir de un string HTML (primer nodo raíz). */
export function fromHTML(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

/** Pausa asíncrona para secuenciar animaciones. */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
