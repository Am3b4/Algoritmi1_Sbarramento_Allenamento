// Tema chiaro o scuro: l'attributo data-tema su <html> decide i colori (vedi stile.css).

import { impostazioni } from './archivio.js';

const scuroDiSistema = window.matchMedia('(prefers-color-scheme: dark)');

export function applicaTema() {
  const scelta = impostazioni().tema;
  const scuro = scelta === 'scuro' || (scelta !== 'chiaro' && scuroDiSistema.matches);
  document.documentElement.dataset.tema = scuro ? 'scuro' : 'chiaro';
}

scuroDiSistema.addEventListener('change', applicaTema);
