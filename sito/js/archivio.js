// Tutto ciò che il sito ricorda sta qui, nel localStorage del browser:
//   algo1.tentativi     {versione, elenco: [una voce per ogni risposta data]}
//   algo1.simulazioni   {versione, elenco: [riepilogo di ogni simulazione]}
//   algo1.impostazioni  {tema, minuti}
//   algo1.sessione      la simulazione in corso, per riprenderla se la pagina si chiude
// La coda del ripasso non si salva: si ricalcola dai tentativi (vedi selezione.js).

import { CONFIG } from './config.js';
import { riepilogoSimulazione } from './punteggio.js';

const PREFISSO = 'algo1.';
export const VERSIONE = 1;
const APP = 'algo1-allenamento';

const memoria = {}; // riserva se il localStorage non è disponibile (navigazione privata, spazio finito)
let cache = {};
let ascoltatori = [];

function leggi(chiave, predefinito) {
  try {
    const testo = localStorage.getItem(PREFISSO + chiave);
    return testo == null ? (memoria[chiave] ?? predefinito) : JSON.parse(testo);
  } catch {
    return memoria[chiave] ?? predefinito;
  }
}

function scrivi(chiave, valore) {
  memoria[chiave] = valore;
  try {
    if (valore === undefined) localStorage.removeItem(PREFISSO + chiave);
    else localStorage.setItem(PREFISSO + chiave, JSON.stringify(valore));
    return true;
  } catch {
    return false;
  }
}

/** Accetta sia {versione, elenco} sia una lista semplice (formato precedente alla versione 1). */
function elenco(grezzo) {
  if (Array.isArray(grezzo)) return grezzo;
  return Array.isArray(grezzo?.elenco) ? grezzo.elenco : [];
}

function cambiato() {
  for (const f of ascoltatori) f();
}

/** Registra una funzione da chiamare quando cambiano tentativi o simulazioni. */
export function alCambio(f) {
  ascoltatori.push(f);
}

// ---------- tentativi ----------

export function tentativi() {
  cache.tentativi ??= elenco(leggi('tentativi', null));
  return cache.tentativi;
}

function salvaTentativi() {
  const riuscito = scrivi('tentativi', { versione: VERSIONE, elenco: cache.tentativi });
  cambiato();
  return riuscito;
}

export function aggiungiTentativi(nuovi) {
  tentativi().push(...nuovi);
  return salvaTentativi();
}

export const tentativiDi = sessione => tentativi().filter(t => t.sessione === sessione);

/** Registra il voto che lo studente si dà su una domanda aperta e aggiorna la simulazione. */
export function valutaAperta(sessione, domanda, voto) {
  const t = tentativi().find(x => x.sessione === sessione && x.domanda === domanda);
  if (!t) return;
  t.esito = `aperta-${voto}`;
  delete t.daValutare;
  salvaTentativi();
  const sim = simulazioni().find(s => s.sessione === sessione);
  if (sim) {
    Object.assign(sim, riepilogoSimulazione(tentativiDi(sessione)));
    salvaSimulazioni();
  }
}

// ---------- simulazioni ----------

export function simulazioni() {
  cache.simulazioni ??= elenco(leggi('simulazioni', null));
  return cache.simulazioni;
}

function salvaSimulazioni() {
  scrivi('simulazioni', { versione: VERSIONE, elenco: cache.simulazioni });
  cambiato();
}

export function aggiungiSimulazione(riepilogo) {
  simulazioni().push(riepilogo);
  salvaSimulazioni();
}

// ---------- impostazioni ----------

const PREDEFINITE = { tema: 'auto', minuti: CONFIG.minutiSimulazione };

export function impostazioni() {
  cache.impostazioni ??= { ...PREDEFINITE, ...leggi('impostazioni', {}) };
  return cache.impostazioni;
}

export function salvaImpostazioni(modifiche) {
  Object.assign(impostazioni(), modifiche);
  scrivi('impostazioni', cache.impostazioni);
}

// ---------- simulazione in corso ----------

export const sessioneInCorso = () => leggi('sessione', null);
export const salvaSessione = s => scrivi('sessione', s);
export const cancellaSessione = () => scrivi('sessione', undefined);

// ---------- esporta, importa, azzera ----------

export function esporta() {
  return {
    app: APP,
    versione: VERSIONE,
    esportato: new Date().toISOString(),
    tentativi: tentativi(),
    simulazioni: simulazioni(),
    impostazioni: impostazioni(),
  };
}

/**
 * Unisce ai dati presenti quelli di un file esportato: le voci già presenti non si duplicano.
 * Restituisce quante voci nuove sono entrate; lancia un errore se il file non è del sito.
 */
export function importa(file) {
  if (file?.app !== APP || !Array.isArray(file.tentativi)) throw new Error('Il file non è un archivio di questo sito.');
  if (file.versione > VERSIONE) throw new Error('Il file viene da una versione più recente del sito.');

  const chiave = t => `${t.sessione}|${t.domanda}|${t.quando}`;
  const presenti = new Set(tentativi().map(chiave));
  const nuovi = file.tentativi.filter(t => t && t.domanda && t.tipo && t.esito && !presenti.has(chiave(t)));
  tentativi().push(...nuovi);
  tentativi().sort((a, b) => String(a.quando).localeCompare(String(b.quando)));

  const sessioni = new Set(simulazioni().map(s => s.sessione));
  const nuove = (file.simulazioni ?? []).filter(s => s && s.sessione && !sessioni.has(s.sessione));
  simulazioni().push(...nuove);
  simulazioni().sort((a, b) => String(a.quando).localeCompare(String(b.quando)));

  const riuscito = salvaTentativi();
  salvaSimulazioni();
  if (!riuscito) throw new Error('Spazio del browser esaurito: i dati non sono stati salvati.');
  return { tentativi: nuovi.length, simulazioni: nuove.length };
}

/** Cancella risposte e simulazioni; le impostazioni restano. */
export function azzera() {
  cache.tentativi = [];
  cache.simulazioni = [];
  salvaTentativi();
  salvaSimulazioni();
  cancellaSessione();
}
