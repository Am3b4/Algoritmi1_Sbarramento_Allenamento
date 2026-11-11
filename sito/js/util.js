// Funzioni di servizio: creare elementi, date, numeri, finestre di conferma.

const PROPRIETA = new Set(['value', 'checked', 'disabled', 'indeterminate', 'hidden', 'open', 'selected', 'htmlFor']);

function riempi(nodo, figli) {
  for (const f of figli.flat(Infinity)) {
    if (f == null || f === false) continue;
    nodo.append(f instanceof Node ? f : String(f));
  }
  return nodo;
}

function imposta(nodo, attributi) {
  for (const [nome, valore] of Object.entries(attributi || {})) {
    if (valore == null || valore === false) continue;
    if (nome.startsWith('on')) nodo.addEventListener(nome.slice(2), valore);
    else if (nome === 'class') nodo.classList.add(...String(valore).split(/\s+/).filter(Boolean));
    else if (PROPRIETA.has(nome)) nodo[nome] = valore;
    else nodo.setAttribute(nome, valore === true ? '' : valore);
  }
}

/** el('button.btn.primario', {onclick}, 'Testo') crea <button class="btn primario">. */
export function el(descrizione, attributi, ...figli) {
  const [tag, ...classi] = descrizione.split('.');
  const nodo = document.createElement(tag || 'div');
  if (classi.length) nodo.className = classi.join(' ');
  imposta(nodo, attributi);
  return riempi(nodo, figli);
}

/** Come el, ma per gli elementi SVG. */
export function svg(tag, attributi, ...figli) {
  const nodo = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [nome, valore] of Object.entries(attributi || {})) {
    if (valore != null && valore !== false) nodo.setAttribute(nome, valore);
  }
  return riempi(nodo, figli);
}

export const due = n => String(n).padStart(2, '0');

/** Giorno locale nella forma AAAA-MM-GG (si confronta come stringa). */
export function giornoLocale(data = new Date()) {
  const d = data instanceof Date ? data : new Date(data);
  return `${d.getFullYear()}-${due(d.getMonth() + 1)}-${due(d.getDate())}`;
}

export function aggiungiGiorni(giorno, n) {
  const [a, m, g] = giorno.split('-').map(Number);
  return giornoLocale(new Date(a, m - 1, g + n));
}

/** Identificativo di una sessione: l'ora locale di inizio. */
export function idSessione(d = new Date()) {
  return `${giornoLocale(d)}T${due(d.getHours())}:${due(d.getMinutes())}:${due(d.getSeconds())}`;
}

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export function formatData(quando) {
  const d = new Date(quando);
  return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${MESI[d.getMonth()]}`;
}

export function formatDataOra(quando) {
  const d = new Date(quando);
  return Number.isNaN(d.getTime()) ? '' : `${formatData(d)}, ${due(d.getHours())}:${due(d.getMinutes())}`;
}

/** 125 secondi → "2:05". */
export function formatDurata(secondi) {
  const s = Math.max(0, Math.round(secondi));
  return `${Math.floor(s / 60)}:${due(s % 60)}`;
}

export const percento = frazione => `${Math.round(frazione * 100)}%`;

/** Numero con la virgola italiana e al più una cifra decimale. */
export function numero(x) {
  return (Math.round(x * 10) / 10).toString().replace('.', ',').replace('-', '−');
}

export const conSegno = n => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0');

export function mescola(lista, casuale = Math.random) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(casuale() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Breve messaggio in basso, che sparisce da solo. */
export function avviso(testo) {
  document.querySelector('.avviso')?.remove();
  const nodo = el('div.avviso', { role: 'status' }, testo);
  document.body.append(nodo);
  setTimeout(() => nodo.remove(), 4000);
}

/** Finestra di conferma; la promessa vale true se l'utente accetta. */
export function conferma({ titolo, testo, ok = 'Conferma', annulla = 'Annulla', pericolo = false }) {
  return new Promise(risolvi => {
    const finestra = el('dialog.finestra', {},
      el('h2', {}, titolo),
      testo ? el('p', {}, testo) : null,
      el('div.azioni', {},
        el('button.btn', { type: 'button', onclick: () => finestra.close('no') }, annulla),
        el(pericolo ? 'button.btn.pericolo' : 'button.btn.primario', { type: 'button', onclick: () => finestra.close('si') }, ok)));
    finestra.addEventListener('close', () => {
      finestra.remove();
      risolvi(finestra.returnValue === 'si');
    });
    document.body.append(finestra);
    finestra.showModal();
  });
}

export const finestraAperta = () => document.querySelector('dialog[open]') !== null;

/** Cambia schermata; se l'indirizzo è già quello, la ridisegna. */
export function vai(indirizzo) {
  if (location.hash === indirizzo) ridisegna();
  else location.hash = indirizzo;
}

export function ridisegna() {
  window.dispatchEvent(new Event('algo1:ridisegna'));
}

/** Come nodo.append, ma salta null e false e accetta liste annidate (come i figli di el). */
export function aggiungi(nodo, ...figli) {
  return riempi(nodo, figli);
}

/** Svuota il nodo e lo riempie di nuovo. */
export function sostituisci(nodo, ...figli) {
  nodo.replaceChildren();
  return riempi(nodo, figli);
}

/** Un punteggio come testo, con il segno meno tipografico se è negativo. */
export const voto = n => String(n).replace('-', '−');
