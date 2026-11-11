// Alberi binari: lettura della notazione k(S, D) e disegno in SVG.
// Notazione: chiave k, sottoalbero sinistro S, sottoalbero destro D; '-' è il sottoalbero vuoto;
// una foglia si scrive con la sola chiave. Esempio: 8(4(2, -), 10).

import { svg } from './util.js';

/** Legge un albero; restituisce {chiave, sin, des} oppure null se il testo non è nella notazione. */
export function analizzaAlbero(testo) {
  const s = String(testo);
  let i = 0;
  const salta = () => {
    while (s[i] === ' ') i++;
  };
  function nodo() {
    salta();
    const m = /^[^\s(),]+/.exec(s.slice(i));
    if (!m) throw new Error('manca una chiave');
    i += m[0].length;
    const n = { chiave: m[0], sin: null, des: null };
    salta();
    if (s[i] === '(') {
      i++;
      n.sin = sottoalbero();
      salta();
      if (s[i++] !== ',') throw new Error('manca la virgola');
      n.des = sottoalbero();
      salta();
      if (s[i++] !== ')') throw new Error('manca la parentesi');
    }
    return n;
  }
  function sottoalbero() {
    salta();
    // '-' da solo è il vuoto; '-5' è una chiave negativa
    if (s[i] === '-' && !/[\w]/.test(s[i + 1] ?? '')) {
      i++;
      return null;
    }
    return nodo();
  }
  try {
    const radice = nodo();
    salta();
    return i === s.length ? radice : null;
  } catch {
    return null;
  }
}

function soloNumeri(n) {
  return !n || (/^\d+$/.test(n.chiave) && soloNumeri(n.sin) && soloNumeri(n.des));
}

/**
 * Cerca nel testo gli alberi scritti in notazione, con chiavi numeriche e almeno una parentesi
 * (un numero da solo non si distingue da un albero di un nodo). Restituisce [{inizio, fine, nodo}].
 */
export function trovaAlberi(testo) {
  const trovati = [];
  const inizio = /\d+\(/g;
  for (let m; (m = inizio.exec(testo));) {
    if (m.index > 0 && /[\w.]/.test(testo[m.index - 1])) continue; // parte di un nome: f2(…), T(n)…
    let aperte = 0;
    let fine = -1;
    for (let j = m.index; j < testo.length; j++) {
      if (testo[j] === '(') aperte++;
      else if (testo[j] === ')' && --aperte === 0) {
        fine = j + 1;
        break;
      }
    }
    if (fine < 0) continue;
    const nodo = analizzaAlbero(testo.slice(m.index, fine));
    if (!nodo || !soloNumeri(nodo)) continue;
    trovati.push({ inizio: m.index, fine, nodo });
    inizio.lastIndex = fine;
  }
  return trovati;
}

/** L'albero, se il testo intero è un albero in notazione con chiavi numeriche; altrimenti null. */
export function alberoIntero(testo) {
  const [a] = trovaAlberi(testo);
  return a && a.inizio === 0 && a.fine === testo.length ? a.nodo : null;
}

/**
 * Assegna a ogni nodo una posizione: y = profondità, x = posto nella visita in ordine simmetrico.
 * Un padre con due figli sta a metà tra loro; con un figlio solo sta poco di lato, così si vede
 * sempre se il figlio è sinistro o destro e il posto del figlio mancante resta vuoto.
 */
function disponi(radice) {
  const nodi = [];
  let posto = 0;
  (function visita(n, profondita) {
    if (!n) return;
    visita(n.sin, profondita + 1);
    const p = { chiave: n.chiave, x: posto++, y: profondita, sin: null, des: null };
    nodi.push(p);
    n.posizione = p;
    visita(n.des, profondita + 1);
    p.sin = n.sin?.posizione ?? null;
    p.des = n.des?.posizione ?? null;
    if (p.sin && p.des) p.x = (p.sin.x + p.des.x) / 2;
    else if (p.sin) p.x = p.sin.x + 0.6;
    else if (p.des) p.x = p.des.x - 0.6;
  })(radice, 0);
  return nodi;
}

/** Disegna l'albero. `piccolo` serve dentro le opzioni di risposta. */
export function disegnaAlbero(radice, { piccolo = false, descrizione = '' } = {}) {
  const nodi = disponi(radice);
  const lunga = Math.max(...nodi.map(n => n.chiave.length));
  const raggio = (piccolo ? 12 : 15) + Math.max(0, lunga - 3) * 3;
  const passoX = raggio * 2 + (piccolo ? 2 : 6);
  const passoY = piccolo ? 36 : 46;
  const margine = raggio + 2;

  const minX = Math.min(...nodi.map(n => n.x));
  const maxX = Math.max(...nodi.map(n => n.x));
  const maxY = Math.max(...nodi.map(n => n.y));
  const larghezza = (maxX - minX) * passoX + margine * 2;
  const altezza = maxY * passoY + margine * 2;
  const px = n => (n.x - minX) * passoX + margine;
  const py = n => n.y * passoY + margine;

  const disegno = svg('svg', {
    class: piccolo ? 'albero piccolo' : 'albero',
    viewBox: `0 0 ${larghezza} ${altezza}`,
    width: larghezza,
    height: altezza,
    role: 'img',
    'aria-label': descrizione ? `Albero ${descrizione}` : 'Albero',
  });
  for (const n of nodi) {
    for (const figlio of [n.sin, n.des]) {
      if (figlio) disegno.append(svg('line', { x1: px(n), y1: py(n), x2: px(figlio), y2: py(figlio) }));
    }
  }
  for (const n of nodi) {
    disegno.append(
      svg('circle', { cx: px(n), cy: py(n), r: raggio }),
      svg('text', { x: px(n), y: py(n), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, n.chiave));
  }
  return disegno;
}
