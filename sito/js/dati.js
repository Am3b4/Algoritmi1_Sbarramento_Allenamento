// Catalogo dei tipi e domande, letti dai file JSON in dati/.

export const dati = {
  lezioni: [],          // [{numero, titolo}]
  tipi: new Map(),      // id del tipo → {id, lezione, titolo, argomento, formato, frequenza, difficolta, trappole}
  domande: new Map(),   // id della domanda → domanda
  perTipo: new Map(),   // id del tipo → [domande]
};

async function leggi(percorso) {
  // no-cache: il browser chiede sempre al server se il file è cambiato, così le correzioni arrivano subito.
  const risposta = await fetch(percorso, { cache: 'no-cache' });
  if (!risposta.ok) throw new Error(`${percorso}: ${risposta.status}`);
  return risposta.json();
}

/** Riempie `dati`. Si può chiamare anche con oggetti già letti (lo fanno le prove). */
export function impostaDati(catalogo, fileDomande) {
  dati.lezioni = catalogo.lezioni.map(l => ({ numero: l.numero, titolo: l.titolo }));
  dati.tipi = new Map(catalogo.tipi.map(t => [t.id, t]));
  dati.domande = new Map();
  dati.perTipo = new Map();
  for (const file of fileDomande) {
    for (const d of file?.domande ?? []) {
      if (!dati.tipi.has(d.tipo)) continue;
      dati.domande.set(d.id, d);
      if (!dati.perTipo.has(d.tipo)) dati.perTipo.set(d.tipo, []);
      dati.perTipo.get(d.tipo).push(d);
    }
  }
}

export async function caricaDati() {
  const catalogo = await leggi('dati/catalogo.json');
  const file = await Promise.all(catalogo.lezioni
    .filter(l => l.domande)
    .map(l => leggi(`dati/${l.domande}`).catch(() => null)));
  impostaDati(catalogo, file);
}

export const titoloLezione = n => dati.lezioni.find(l => l.numero === n)?.titolo ?? `Lezione ${n}`;

/** Testo della trappola con codice E1, E2, … di un tipo; null per "altro" o codici sconosciuti. */
export function testoTrappola(idTipo, codice) {
  const m = /^E(\d+)$/.exec(codice ?? '');
  return m ? dati.tipi.get(idTipo)?.trappole?.[Number(m[1]) - 1] ?? null : null;
}

/** Tipi che hanno almeno una domanda, nell'ordine del programma. */
export function tipiConDomande() {
  return [...dati.tipi.values()].filter(t => dati.perTipo.has(t.id));
}

/** Chiave di un argomento: lo stesso nome può comparire in lezioni diverse. */
export const chiaveArgomento = tipo => `${tipo.lezione}|${tipo.argomento}`;
