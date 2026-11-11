// Calcoli per la pagina delle statistiche e per la home. Solo conti, niente pagina.

import { CONFIG } from './config.js';
import { dati, chiaveArgomento, testoTrappola } from './dati.js';
import { frazione, punti, valido } from './punteggio.js';
import { prioritaTipi } from './selezione.js';

// ---------- andamento delle simulazioni ----------

/** Media del punteggio sulle ultime cinque simulazioni fino alla i-esima compresa. */
export function mediaMobile(simulazioni, finestra = 5) {
  return simulazioni.map((_, i) => {
    const pezzo = simulazioni.slice(Math.max(0, i - finestra + 1), i + 1);
    return pezzo.reduce((s, x) => s + x.punteggio, 0) / pezzo.length;
  });
}

export function riepilogoAndamento(simulazioni) {
  if (!simulazioni.length) return null;
  const medie = mediaMobile(simulazioni);
  return {
    numero: simulazioni.length,
    ultimo: simulazioni[simulazioni.length - 1],
    mediaUltime: medie[medie.length - 1],
    quanteInMedia: Math.min(5, simulazioni.length),
    superate: simulazioni.filter(s => s.punteggio >= CONFIG.soglia).length / simulazioni.length,
  };
}

// ---------- dove sbaglio ----------

function raggruppa(tentativi, chiaveDi) {
  const gruppi = new Map();
  for (const t of tentativi) {
    if (!valido(t)) continue;
    const tipo = dati.tipi.get(t.tipo);
    if (!tipo) continue;
    const chiave = chiaveDi(tipo);
    const g = gruppi.get(chiave) ?? { risposte: 0, somma: 0 };
    g.risposte++;
    g.somma += frazione(t.esito);
    gruppi.set(chiave, g);
  }
  return gruppi;
}

/** Le 15 lezioni in ordine, con accuratezza (null se nessuna risposta) e numero di risposte. */
export function perLezione(tentativi) {
  const gruppi = raggruppa(tentativi, tipo => tipo.lezione);
  return dati.lezioni.map(l => {
    const g = gruppi.get(l.numero);
    return { lezione: l.numero, titolo: l.titolo, risposte: g?.risposte ?? 0, accuratezza: g ? g.somma / g.risposte : null };
  });
}

/** Gli argomenti con almeno una risposta, dal peggiore. */
export function perArgomento(tentativi) {
  const gruppi = raggruppa(tentativi, chiaveArgomento);
  return [...gruppi].map(([chiave, g]) => {
    const [lezione, argomento] = chiave.split('|');
    return { chiave, lezione: Number(lezione), argomento, risposte: g.risposte, accuratezza: g.somma / g.risposte };
  }).sort((a, b) => a.accuratezza - b.accuratezza || b.risposte - a.risposte);
}

/** I tipi con almeno una risposta, per priorità di ripasso. */
export function perTipo(tentativi) {
  return prioritaTipi(tentativi).filter(r => r.tentativi > 0).sort((a, b) => b.priorita - a.priorita);
}

/** I tipi su cui conviene allenarsi adesso: già provati, non perfetti, priorità più alta. */
export function tipiDeboli(tentativi, quanti = 3) {
  return perTipo(tentativi).filter(r => r.accuratezza < 1).slice(0, quanti);
}

export function tipiMaiProvati(tentativi) {
  return prioritaTipi(tentativi).filter(r => r.tentativi === 0).map(r => r.tipo);
}

/** Ultimi tentativi che soddisfano il filtro sul tipo, dal più recente. */
export function ultimiTentativi(tentativi, filtroTipo, quanti = 5) {
  return tentativi
    .filter(t => valido(t) && dati.tipi.has(t.tipo) && filtroTipo(dati.tipi.get(t.tipo)))
    .sort((a, b) => String(b.quando).localeCompare(String(a.quando)))
    .slice(0, quanti);
}

// ---------- come sbaglio ----------

/**
 * Per ogni trappola in cui lo studente è caduto: quante volte, e su quanti errori di quel tipo.
 * Ordinate dalla più frequente. Gli errori con codice "altro" contano solo nel totale del tipo.
 */
export function trappole(tentativi) {
  const erroriTipo = new Map();
  const conteggi = new Map();
  for (const t of tentativi) {
    if (t.esito !== 'sbagliata') continue;
    erroriTipo.set(t.tipo, (erroriTipo.get(t.tipo) ?? 0) + 1);
    if (!testoTrappola(t.tipo, t.errore)) continue;
    const chiave = `${t.tipo}|${t.errore}`;
    conteggi.set(chiave, (conteggi.get(chiave) ?? 0) + 1);
  }
  return [...conteggi].map(([chiave, volte]) => {
    const [idTipo, codice] = chiave.split('|');
    return { tipo: dati.tipi.get(idTipo), codice, testo: testoTrappola(idTipo, codice), volte, erroriDelTipo: erroriTipo.get(idTipo) };
  }).sort((a, b) => b.volte - a.volte || b.volte / b.erroriDelTipo - a.volte / a.erroriDelTipo);
}

// ---------- altri numeri ----------

export function altriNumeri(tentativi) {
  const sim = tentativi.filter(t => valido(t) && t.modalita === 'simulazione');
  const incerte = sim.filter(t => t.incerta && t.esito !== 'bianca');
  return {
    risposteSimulazione: sim.length,
    secondiPerDomanda: sim.length ? sim.reduce((s, t) => s + (t.secondi || 0), 0) / sim.length : null,
    bianche: sim.length ? sim.filter(t => t.esito === 'bianca').length / sim.length : null,
    incerte: {
      numero: incerte.length,
      giuste: incerte.filter(t => frazione(t.esito) === 1).length,
      saldo: incerte.reduce((s, t) => s + punti(t.esito), 0),
    },
  };
}
