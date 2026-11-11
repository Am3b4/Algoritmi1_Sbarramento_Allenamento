// Come si mostrano i contenuti di una domanda: testo, codice, alberi, array, opzioni.

import { el } from './util.js';
import { analizzaAlbero, trovaAlberi, alberoIntero, disegnaAlbero } from './alberi.js';

// ---------- array ----------

const ELEMENTO = /^(?:[−-]?\d+(?:[.,]\d+)?|None|DELETED|True|False|'[^']*'|"[^"]*"|…|\.\.\.|[A-Za-z]\w{0,3}|\d+[a-z]|n [−+-] \d+)$/;

function elementiArray(interno) {
  if (!interno.trim()) return [];
  const elementi = interno.split(',').map(e => e.trim());
  return elementi.every(e => ELEMENTO.test(e)) ? elementi : null;
}

/** Array scritti nel testo come [3, 5, 4]: almeno `minimo` elementi semplici, non un indice come A[i]. */
function trovaArray(testo, minimo = 3) {
  const trovati = [];
  const quadre = /\[([^\[\]]*)\]/g;
  for (let m; (m = quadre.exec(testo));) {
    if (m.index > 0 && /[\w)\]]/.test(testo[m.index - 1])) continue;
    const elementi = elementiArray(m[1]);
    if (elementi && elementi.length >= minimo) trovati.push({ inizio: m.index, fine: m.index + m[0].length, elementi });
  }
  return trovati;
}

function arrayIntero(testo) {
  const m = /^\[([^\[\]]*)\]$/.exec(testo.trim());
  return m ? elementiArray(m[1]) : null;
}

/** Le quattro opzioni si mostrano a celle solo se sono tutte array, così hanno lo stesso aspetto. */
export function opzioniComeArray(opzioni) {
  const letti = opzioni.map(arrayIntero);
  return letti.every(Boolean) && letti.some(a => a.length >= 2);
}

/** Celle con l'indice sopra, così le posizioni si leggono subito. */
function celle(elementi) {
  if (!elementi.length) return el('span.vuoto', {}, '[ ] (vuoto)');
  const conIndici = !elementi.some(e => e === '…' || e === '...'); // con i puntini gli indici non sarebbero veri
  return el('span.celle', { role: 'img', 'aria-label': `[${elementi.join(', ')}]` },
    elementi.map((valore, i) => el('span.cella', { 'aria-hidden': 'true' },
      conIndici ? el('span.indice', {}, i) : null,
      el('span.valore', {}, valore))));
}

// ---------- testo ----------

function figuraAlbero(nodo, notazione, piccolo = false) {
  return el(piccolo ? 'span.figura.piccola' : 'div.figura', {}, disegnaAlbero(nodo, { piccolo, descrizione: notazione }));
}

/**
 * Una riga di testo: gli array diventano celle; gli alberi in notazione restano scritti
 * e finiscono anche in `figure`, perché chi chiama li disegni sotto il testo.
 */
function rendiRiga(testo, figure, conArray = true) {
  const pezzi = trovaAlberi(testo).map(a => ({ ...a, genere: 'albero' }));
  if (conArray) {
    for (const a of trovaArray(testo)) {
      if (!pezzi.some(p => a.inizio < p.fine && a.fine > p.inizio)) pezzi.push({ ...a, genere: 'array' });
    }
  }
  pezzi.sort((a, b) => a.inizio - b.inizio);

  const frammento = document.createDocumentFragment();
  let posizione = 0;
  for (const p of pezzi) {
    frammento.append(testo.slice(posizione, p.inizio));
    const originale = testo.slice(p.inizio, p.fine);
    if (p.genere === 'albero') {
      frammento.append(el('code.notazione', {}, originale));
      figure.push({ nodo: p.nodo, notazione: originale });
    } else if (/[.,;:)]/.test(testo[p.fine] ?? '')) {
      // La punteggiatura che segue resta attaccata all'array, invece di andare a capo da sola.
      frammento.append(el('span.con-punto', {}, celle(p.elementi), testo[p.fine]));
      posizione = p.fine + 1;
      continue;
    } else frammento.append(celle(p.elementi));
    posizione = p.fine;
  }
  frammento.append(testo.slice(posizione));
  return frammento;
}

export const riquadroCodice = codice => el('pre.codice', { tabindex: 0 }, el('code', {}, codice));

/** Testo della domanda con l'eventuale codice e gli alberi disegnati. */
export function corpoDomanda(domanda) {
  const corpo = el('div.corpo-domanda');
  const figure = [];
  for (const blocco of domanda.testo.split(/\n{2,}/)) {
    // Un blocco su più righe è codice scritto dentro il testo.
    if (blocco.includes('\n')) corpo.append(riquadroCodice(blocco));
    else corpo.append(el('p.testo', {}, rendiRiga(blocco, figure)));
  }
  if (domanda.codice) corpo.append(riquadroCodice(domanda.codice));
  if (domanda.albero) {
    const nodo = analizzaAlbero(domanda.albero);
    corpo.append(nodo ? figuraAlbero(nodo, domanda.albero) : riquadroCodice(domanda.albero));
  }
  if (figure.length) corpo.append(el('div.figure', {}, figure.map(f => figuraAlbero(f.nodo, f.notazione))));
  return corpo;
}

/** Contenuto di un'opzione: un albero disegnato, un array a celle oppure testo. */
export function rendiOpzione(testo, comeArray = false) {
  const nodo = alberoIntero(testo.trim());
  if (nodo) return figuraAlbero(nodo, testo, true);
  if (comeArray) return celle(arrayIntero(testo));
  const figure = [];
  const riga = rendiRiga(testo, figure, false);
  return el('span', {}, riga, figure.map(f => figuraAlbero(f.nodo, f.notazione, true)));
}
