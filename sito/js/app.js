// Avvio del sito e passaggio da una schermata all'altra.
// L'indirizzo dopo il # dice quale schermata mostrare: #/simulazione, #/statistiche, …

import { caricaDati } from './dati.js';
import { el } from './util.js';
import { applicaTema } from './tema.js';
import { vistaHome } from './viste/home.js';
import { vistaSimulazione } from './viste/simulazione.js';
import { vistaFiltro, vistaPratica, vistaRipasso } from './viste/pratica.js';
import { vistaCorrezione } from './viste/correzione.js';
import { vistaStatistiche } from './viste/statistiche.js';
import { vistaImpostazioni } from './viste/impostazioni.js';

const SCHERMATE = [
  [/^\/?$/, vistaHome],
  [/^\/simulazione$/, vistaSimulazione],
  [/^\/allenamento$/, vistaFiltro],
  [/^\/pratica$/, vistaPratica],
  [/^\/ripasso$/, vistaRipasso],
  [/^\/correzione\/(.+)$/, vistaCorrezione],
  [/^\/statistiche$/, vistaStatistiche],
  [/^\/impostazioni$/, vistaImpostazioni],
];

const radice = document.getElementById('schermata');
let chiudi = null; // funzione che la schermata corrente lascia per fermare orologi e ascolto dei tasti
let mostrato = null;

function mostra() {
  const percorso = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';
  chiudi?.();
  chiudi = null;
  radice.replaceChildren();
  for (const [forma, vista] of SCHERMATE) {
    const m = forma.exec(percorso);
    if (!m) continue;
    chiudi = vista(radice, ...m.slice(1)) ?? null;
    for (const link of document.querySelectorAll('.testata-sito nav a')) {
      link.toggleAttribute('aria-current', link.getAttribute('href') === `#${percorso}`);
    }
    if (mostrato !== percorso) {
      window.scrollTo(0, 0);
      if (mostrato !== null) radice.focus({ preventScroll: true }); // chi usa uno screen reader riparte dall'inizio della schermata
    }
    mostrato = percorso;
    return;
  }
  location.replace('#/');
}

async function avvia() {
  applicaTema();
  try {
    await caricaDati();
  } catch (errore) {
    radice.replaceChildren(
      el('h1', {}, 'Non riesco a caricare le domande'),
      el('p', {}, 'Controlla la connessione e ricarica la pagina.'),
      el('p.tenue', {}, 'Se stai provando il sito sul tuo computer: i dati si generano con «python strumenti/costruisci_sito.py» e la cartella sito/ va aperta con un server locale, non con un doppio clic.'),
      el('p.tenue', {}, String(errore.message ?? errore)));
    return;
  }
  // "Vai al contenuto" sposta il fuoco senza cambiare l'indirizzo, che qui decide la schermata.
  document.querySelector('.salta').addEventListener('click', e => {
    e.preventDefault();
    radice.focus();
  });
  window.addEventListener('hashchange', mostra);
  window.addEventListener('algo1:ridisegna', mostra);
  mostra();
}

avvia();
