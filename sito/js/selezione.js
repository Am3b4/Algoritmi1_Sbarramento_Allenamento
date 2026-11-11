// Come vengono scelte le domande nelle tre modalità.
// Tutte le funzioni ricevono il registro dei tentativi e non toccano il browser,
// così si possono provare da sole (strumenti/prova_logica.mjs).

import { CONFIG } from './config.js';
import { dati, tipiConDomande } from './dati.js';
import { frazione, daRipassare, valido } from './punteggio.js';
import { mescola, giornoLocale, aggiungiGiorni } from './util.js';

const peso = tipo => CONFIG.pesi[tipo.frequenza] ?? 1;

/** Per ogni domanda già vista, l'istante dell'ultima volta (in millisecondi). */
export function ultimaVolta(tentativi) {
  const viste = new Map();
  for (const t of tentativi) {
    const quando = Date.parse(t.quando) || 0;
    if (quando >= (viste.get(t.domanda) ?? -1)) viste.set(t.domanda, quando);
  }
  return viste;
}

/** Estrae un elemento con probabilità proporzionale al suo peso. */
function pescaPesata(tipi, casuale) {
  let soglia = casuale() * tipi.reduce((somma, t) => somma + peso(t), 0);
  for (const t of tipi) {
    soglia -= peso(t);
    if (soglia < 0) return t;
  }
  return tipi[tipi.length - 1];
}

/**
 * Una variante del tipo: una mai vista, se c'è; altrimenti quella vista meno di recente.
 * `escluse` sono le domande già usate nella sessione in corso.
 */
export function scegliVariante(idTipo, viste, escluse = new Set(), casuale = Math.random) {
  const candidate = (dati.perTipo.get(idTipo) ?? []).filter(d => !escluse.has(d.id));
  if (!candidate.length) return null;
  const nuove = candidate.filter(d => !viste.has(d.id));
  if (nuove.length) return nuove[Math.floor(casuale() * nuove.length)];
  return candidate.reduce((a, b) => (viste.get(b.id) < viste.get(a.id) ? b : a));
}

// ---------- simulazione ----------

/**
 * 14 domande a risposta multipla e una aperta, come nel test vero.
 * Non guarda gli errori dello studente: il punteggio deve essere una stima onesta.
 */
export function componiSimulazione(tentativi, casuale = Math.random) {
  const viste = ultimaVolta(tentativi);
  const tutti = tipiConDomande();
  const scelti = [];
  const perLezione = new Map();
  const prendi = tipo => {
    scelti.push(tipo);
    perLezione.set(tipo.lezione, (perLezione.get(tipo.lezione) ?? 0) + 1);
  };

  const aperti = tutti.filter(t => t.formato === 'aperta');
  if (aperti.length) prendi(pescaPesata(aperti, casuale));

  let candidati = tutti.filter(t => t.formato === 'multipla');
  for (let mancanti = CONFIG.multipleSimulazione; mancanti > 0 && candidati.length; mancanti--) {
    let ammessi = candidati.filter(t => (perLezione.get(t.lezione) ?? 0) < CONFIG.maxPerLezione);
    // Se le domande rimaste bastano appena per arrivare a dieci lezioni, si pesca solo da lezioni nuove.
    if (CONFIG.minLezioni - perLezione.size >= mancanti) {
      const nuove = ammessi.filter(t => !perLezione.has(t.lezione));
      if (nuove.length) ammessi = nuove;
    }
    if (!ammessi.length) ammessi = candidati; // archivio incompleto: meglio ripetere una lezione che avere meno domande
    const tipo = pescaPesata(ammessi, casuale);
    prendi(tipo);
    candidati = candidati.filter(t => t !== tipo);
  }

  // Ordine del programma, con la domanda aperta al posto della sua lezione.
  scelti.sort((a, b) => a.lezione - b.lezione || a.id.localeCompare(b.id));
  return scelti.map(t => scegliVariante(t.id, viste, undefined, casuale));
}

// ---------- allenamento mirato ----------

/**
 * Generatore di domande per un insieme di tipi. I tipi si alternano; di ogni tipo
 * escono prima le varianti mai viste. prossima() restituisce null quando sono finite.
 */
export function creaAllenamento(idTipi, tentativi, casuale = Math.random) {
  const viste = ultimaVolta(tentativi);
  const usate = new Set();
  const tipi = idTipi.filter(id => dati.perTipo.has(id));
  let giro = [];
  let ultimo = null;

  const rimaste = id => dati.perTipo.get(id).filter(d => !usate.has(d.id));
  const haNuove = id => rimaste(id).some(d => !viste.has(d.id));

  function nuovoGiro() {
    const vivi = tipi.filter(id => rimaste(id).length);
    // Prima i tipi che hanno ancora varianti mai viste.
    giro = [...mescola(vivi.filter(haNuove), casuale), ...mescola(vivi.filter(id => !haNuove(id)), casuale)];
    if (giro.length > 1 && giro[0] === ultimo) giro.push(giro.shift());
  }

  return {
    totale: tipi.reduce((n, id) => n + dati.perTipo.get(id).length, 0),
    prossima() {
      if (!giro.length) nuovoGiro();
      if (!giro.length) return null;
      ultimo = giro.shift();
      const domanda = scegliVariante(ultimo, viste, usate, casuale);
      usate.add(domanda.id);
      return domanda;
    },
  };
}

// ---------- ripasso degli errori ----------

/**
 * Coda a tre caselle delle domande sbagliate o lasciate in bianco.
 * Si ricalcola ripercorrendo i tentativi in ordine di tempo, così resta
 * giusta anche dopo un'importazione. Restituisce Map: id domanda → {casella, scadenza, tipo}.
 */
export function calcolaCoda(tentativi) {
  const coda = new Map();
  const intervalli = CONFIG.ripasso.intervalli;
  const inOrdine = tentativi.filter(valido).sort((a, b) => String(a.quando).localeCompare(String(b.quando)));
  for (const t of inOrdine) {
    const giorno = giornoLocale(t.quando);
    if (daRipassare(t.esito)) {
      coda.set(t.domanda, { casella: 1, scadenza: aggiungiGiorni(giorno, intervalli[0]), tipo: t.tipo });
      continue;
    }
    const voce = coda.get(t.domanda);
    // Una risposta giusta prima della scadenza non fa avanzare: non è passato abbastanza tempo.
    if (!voce || giorno < voce.scadenza) continue;
    if (voce.casella >= intervalli.length) coda.delete(t.domanda);
    else {
      voce.casella++;
      voce.scadenza = aggiungiGiorni(giorno, intervalli[voce.casella - 1]);
    }
  }
  return coda;
}

/** Domande della coda da ripassare oggi, dalla più vecchia. */
export function inScadenza(tentativi, oggi = new Date()) {
  const giorno = giornoLocale(oggi);
  return [...calcolaCoda(tentativi)]
    .filter(([id, voce]) => voce.scadenza <= giorno && dati.domande.has(id))
    .sort(([, a], [, b]) => a.scadenza.localeCompare(b.scadenza) || a.casella - b.casella)
    .map(([id]) => dati.domande.get(id));
}

/**
 * Priorità di ripasso di ogni tipo: (1 − accuratezza recente) × peso della frequenza.
 * L'accuratezza recente conta gli ultimi 10 tentativi; un tipo mai provato vale 0,5.
 */
export function prioritaTipi(tentativi) {
  const perTipo = new Map();
  for (const t of tentativi) {
    if (!valido(t)) continue;
    if (!perTipo.has(t.tipo)) perTipo.set(t.tipo, []);
    perTipo.get(t.tipo).push(t);
  }
  return tipiConDomande().map(tipo => {
    const tutti = (perTipo.get(tipo.id) ?? []).sort((a, b) => String(a.quando).localeCompare(String(b.quando)));
    const recenti = tutti.slice(-CONFIG.ripasso.ultimi);
    const accuratezza = recenti.length ? recenti.reduce((s, t) => s + frazione(t.esito), 0) / recenti.length : null;
    return {
      tipo,
      tentativi: tutti.length,
      recenti: recenti.length,
      accuratezza,
      ultimo: tutti.length ? tutti[tutti.length - 1].quando : null,
      priorita: (1 - (accuratezza ?? 0.5)) * peso(tipo),
    };
  });
}

/** Una sessione di ripasso: circa 6 domande in scadenza e il resto dai tipi più deboli. */
export function componiRipasso(tentativi, oggi = new Date(), casuale = Math.random) {
  const { domande: totale, inScadenza: quota, maxAperte } = CONFIG.ripasso;
  const scadute = inScadenza(tentativi, oggi);
  const viste = ultimaVolta(tentativi);

  const dallaCoda = scadute.slice(0, quota);
  const usate = new Set(dallaCoda.map(d => d.id));
  const tipiPresi = new Set(dallaCoda.map(d => d.tipo));

  // Tipi deboli: a parità di priorità l'ordine è casuale, così i tipi mai provati ruotano.
  const classifica = mescola(prioritaTipi(tentativi), casuale).sort((a, b) => b.priorita - a.priorita);
  const deboli = [];
  let aperte = 0;
  for (const { tipo, priorita } of classifica) {
    if (dallaCoda.length + deboli.length >= totale || priorita <= 0) break;
    if (tipiPresi.has(tipo.id)) continue;
    if (tipo.formato === 'aperta' && aperte >= maxAperte) continue;
    const domanda = scegliVariante(tipo.id, viste, usate, casuale);
    if (!domanda) continue;
    if (tipo.formato === 'aperta') aperte++;
    deboli.push(domanda);
    usate.add(domanda.id);
    tipiPresi.add(tipo.id);
  }

  // Se i tipi deboli non bastano, si completano i posti con altre domande in scadenza.
  const altre = scadute.slice(quota, quota + totale - dallaCoda.length - deboli.length);
  return {
    domande: mescola([...dallaCoda, ...altre, ...deboli], casuale),
    dallaCoda: dallaCoda.length + altre.length,
    daiTipiDeboli: deboli.length,
  };
}
