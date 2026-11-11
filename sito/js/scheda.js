// Pezzi di pagina condivisi: le opzioni di una domanda e la scheda di correzione.

import { ETICHETTE_FREQUENZA, linkSegnalazione } from './config.js';
import { dati, testoTrappola, titoloLezione } from './dati.js';
import { el, avviso, formatDataOra } from './util.js';
import { corpoDomanda, rendiOpzione, opzioniComeArray, riquadroCodice } from './contenuti.js';

const LETTERE = ['a', 'b', 'c', 'd'];

export const ESITI = {
  giusta: { icona: '✓', testo: 'Giusta', classe: 'giusta' },
  sbagliata: { icona: '✗', testo: 'Sbagliata', classe: 'sbagliata' },
  bianca: { icona: '○', testo: 'In bianco', classe: 'bianca' },
  'aperta-0': { icona: '✗', testo: 'Aperta: 0 punti', classe: 'sbagliata' },
  'aperta-1': { icona: '◐', testo: 'Aperta: 1 punto', classe: 'parziale' },
  'aperta-2': { icona: '✓', testo: 'Aperta: 2 punti', classe: 'giusta' },
};

/** Etichetta con icona e scritta: l'esito non è mai affidato al solo colore. */
export function etichettaEsito(tentativo) {
  if (tentativo.daValutare) return el('span.esito.attesa', {}, el('span', { 'aria-hidden': 'true' }, '✎'), ' Da valutare');
  const e = ESITI[tentativo.esito] ?? ESITI.bianca;
  return el(`span.esito.${e.classe}`, {}, el('span', { 'aria-hidden': 'true' }, e.icona), ` ${e.testo}`);
}

/**
 * Le quattro opzioni come pulsanti grandi.
 * ordine: gli indici del file nell'ordine in cui si mostrano (mescolati a ogni presentazione).
 * Con `corretta: true` le opzioni non si toccano più e mostrano risposta giusta e risposta data.
 */
export function gruppoOpzioni(domanda, ordine, { scelta = null, corretta = false, alScegliere = null } = {}) {
  const comeArray = opzioniComeArray(domanda.opzioni);
  const pulsanti = ordine.map((indice, posto) => {
    const giusta = indice === domanda.corretta;
    const data = indice === scelta;
    const nota = !corretta ? null
      : giusta ? el('span.nota.giusta', {}, el('span', { 'aria-hidden': 'true' }, '✓'), data ? ' Giusta: è la tua risposta' : ' Risposta giusta')
      : data ? el('span.nota.sbagliata', {}, el('span', { 'aria-hidden': 'true' }, '✗'), ' La tua risposta') : null;
    return el('button.opzione', {
      type: 'button',
      role: 'radio',
      'aria-checked': String(data),
      'aria-disabled': corretta ? 'true' : null,
      class: corretta ? `ferma ${giusta ? 'giusta' : data ? 'sbagliata' : ''}` : '',
      'data-indice': indice,
      onclick: corretta ? null : () => alScegliere?.(indice),
    },
      el('span.lettera', { 'aria-hidden': 'true' }, LETTERE[posto]),
      el('span.contenuto', {}, rendiOpzione(domanda.opzioni[indice], comeArray), nota));
  });
  const gruppo = el('div.opzioni', { role: 'radiogroup', 'aria-label': 'Opzioni di risposta' }, pulsanti);
  return {
    nodo: gruppo,
    /** Aggiorna la selezione senza ridisegnare, così il fuoco della tastiera resta dov'è. */
    seleziona(indice) {
      for (const p of pulsanti) p.setAttribute('aria-checked', String(Number(p.dataset.indice) === indice));
    },
  };
}

/** Riga con tipo, lezione e frequenza: si mostra solo dopo la risposta, per non dare indizi. */
export function intestazioneTipo(domanda) {
  const tipo = dati.tipi.get(domanda.tipo);
  return el('p.tipo-domanda', {},
    el('strong', {}, tipo.titolo), ` · Lezione ${tipo.lezione}: ${titoloLezione(tipo.lezione)} · ${ETICHETTE_FREQUENZA[tipo.frequenza]}`);
}

export function pulsanteSegnala(domanda) {
  const link = linkSegnalazione(domanda);
  if (link) return el('a.segnala', { href: link, target: '_blank', rel: 'noopener' }, `Segnala un errore (${domanda.id})`);
  return el('button.segnala', {
    type: 'button',
    onclick: () => {
      navigator.clipboard?.writeText(domanda.id).catch(() => {});
      avviso(`Domanda ${domanda.id}: comunica questo codice a chi gestisce il sito.`);
    },
  }, `Segnala un errore (${domanda.id})`);
}

/** Spiegazione, con la trappola in cui si è caduti se la risposta sbagliata ne porta il codice. */
export function bloccoSpiegazione(domanda, tentativo) {
  const trappola = tentativo ? testoTrappola(domanda.tipo, tentativo.errore) : null;
  return el('div.spiegazione', {},
    trappola ? el('p.trappola', {}, el('strong', {}, 'L\'errore che hai fatto: '), trappola) : null,
    el('p', {}, el('strong', {}, 'Spiegazione. '), domanda.spiegazione));
}

/**
 * Confronto di una domanda aperta: risposta dello studente, soluzione di riferimento,
 * lista di controllo e pulsanti 0 / 1 / 2 punti. alValutare(voto) riceve il voto scelto.
 */
export function bloccoAperta(domanda, { risposta = '', voto = null, alValutare }) {
  const voti = [0, 1, 2].map(v => el('button.btn.voto', {
    type: 'button',
    'aria-pressed': String(voto === v),
    onclick: () => alValutare(v),
  }, v === 1 ? '1 punto' : `${v} punti`));
  return el('div.aperta', {},
    el('div.confronto', {},
      el('div', {}, el('h4', {}, 'La tua risposta'),
        risposta.trim() ? riquadroCodice(risposta) : el('p.tenue', {}, 'Niente di scritto qui. Se l\'hai scritta su carta, confrontala con la soluzione.')),
      el('div', {}, el('h4', {}, 'Soluzione di riferimento'), riquadroCodice(domanda.soluzione))),
    el('h4', {}, 'Lista di controllo'),
    el('ul.controlli', {}, domanda.controlli.map(c => el('li', {}, el('label', {}, el('input', { type: 'checkbox' }), el('span', {}, c))))),
    el('div.valutazione', { role: 'group', 'aria-label': 'Quanti punti ti dai?' },
      el('span', {}, 'Quanti punti ti dai?'), voti));
}

/**
 * Scheda di una domanda già fatta: testo, risposta data, risposta giusta, spiegazione.
 * alValutare, se presente, permette di (ri)assegnare il voto a una domanda aperta.
 */
export function schedaCorrezione(tentativo, { numero = null, alValutare = null, conData = false } = {}) {
  const domanda = dati.domande.get(tentativo.domanda);
  if (!domanda) {
    return el('article.scheda.corretta', {},
      el('header.testata', {}, el('h3', {}, numero ? `Domanda ${numero}` : tentativo.domanda), etichettaEsito(tentativo)),
      el('p.tenue', {}, `La domanda ${tentativo.domanda} non è più nell'archivio.`));
  }
  const voto = /^aperta-(\d)$/.exec(tentativo.esito);
  return el('article.scheda.corretta', { id: `d-${domanda.id}` },
    el('header.testata', {},
      el('h3', {}, numero ? `Domanda ${numero}` : formatDataOra(tentativo.quando), tentativo.incerta ? el('span.incerta', {}, ' · non eri sicuro') : null),
      etichettaEsito(tentativo)),
    conData && numero ? el('p.tenue', {}, formatDataOra(tentativo.quando)) : null,
    intestazioneTipo(domanda),
    corpoDomanda(domanda),
    domanda.formato === 'multipla'
      ? gruppoOpzioni(domanda, [0, 1, 2, 3], { scelta: tentativo.scelta ?? null, corretta: true }).nodo
      : alValutare
        ? bloccoAperta(domanda, { risposta: tentativo.risposta ?? '', voto: voto && !tentativo.daValutare ? Number(voto[1]) : null, alValutare })
        : el('div.aperta', {}, el('h4', {}, 'Soluzione di riferimento'), riquadroCodice(domanda.soluzione)),
    bloccoSpiegazione(domanda, tentativo),
    pulsanteSegnala(domanda));
}
