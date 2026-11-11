// Esito e punti di una risposta, riepilogo di una simulazione.

import { CONFIG } from './config.js';

/** Punti del test: +2 giusta, −1 sbagliata, 0 in bianco; per le aperte i punti assegnati. */
export function punti(esito) {
  if (esito === 'giusta') return 2;
  if (esito === 'sbagliata') return -1;
  const m = /^aperta-(\d)$/.exec(esito);
  return m ? Number(m[1]) : 0;
}

/** Quanto vale una risposta per l'accuratezza: 1 giusta, 0,5 aperta a metà, 0 il resto. */
export function frazione(esito) {
  if (esito === 'giusta' || esito === 'aperta-2') return 1;
  return esito === 'aperta-1' ? 0.5 : 0;
}

/** Per il ripasso contano come errori anche le risposte in bianco e le aperte non piene. */
export const daRipassare = esito => esito !== 'giusta' && esito !== 'aperta-2';

/** Un tentativo ancora da autovalutare non entra nelle statistiche. */
export const valido = tentativo => !tentativo.daValutare;

/**
 * Costruisce l'elemento del registro per una risposta.
 * scelta: indice dell'opzione nel file (non nell'ordine mescolato), null se in bianco.
 * punti: per le aperte, il voto che lo studente si è dato; null se non ancora valutata.
 */
export function creaTentativo(domanda, { scelta = null, incerta = false, testo = '', punti: voto = null, secondi, modalita, sessione, quando }) {
  const t = { domanda: domanda.id, tipo: domanda.tipo, esito: 'bianca', errore: null, secondi, modalita, sessione, quando };
  if (domanda.formato === 'multipla') {
    if (scelta != null) {
      t.scelta = scelta;
      if (scelta === domanda.corretta) t.esito = 'giusta';
      else {
        t.esito = 'sbagliata';
        t.errore = domanda.errori?.[scelta] ?? 'altro';
      }
    }
  } else {
    if (testo.trim()) t.risposta = testo;
    if (voto != null) t.esito = `aperta-${voto}`;
    else if (testo.trim()) {
      t.esito = 'aperta-0';
      t.daValutare = true;
    }
  }
  if (incerta) t.incerta = true;
  return t;
}

/** Punteggio e conteggi di una simulazione, dai suoi tentativi. */
export function riepilogoSimulazione(tentativi) {
  const r = { punteggio: 0, giuste: 0, sbagliate: 0, bianche: 0, aperta: null, apertaDaValutare: false };
  for (const t of tentativi) {
    r.punteggio += punti(t.esito);
    if (t.esito === 'giusta') r.giuste++;
    else if (t.esito === 'sbagliata') r.sbagliate++;
    else if (t.esito === 'bianca') r.bianche++;
    else r.aperta = punti(t.esito);
    if (t.daValutare) r.apertaDaValutare = true;
  }
  r.superata = r.punteggio >= CONFIG.soglia;
  return r;
}
