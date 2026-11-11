// Prove della logica del sito (scelta delle domande, coda del ripasso, statistiche).
// Uso:  python strumenti/costruisci_sito.py && node strumenti/prova_logica.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Node non ha il localStorage del browser: ne basta uno finto in memoria.
const scatola = new Map();
globalThis.localStorage = {
  getItem: k => scatola.get(k) ?? null,
  setItem: (k, v) => scatola.set(k, String(v)),
  removeItem: k => scatola.delete(k),
};

const sito = new URL('../sito/', import.meta.url);
const leggi = nome => JSON.parse(readFileSync(fileURLToPath(new URL(`dati/${nome}`, sito)), 'utf-8'));
const modulo = nome => import(new URL(`js/${nome}`, sito));

const { dati, impostaDati } = await modulo('dati.js');
const { CONFIG } = await modulo('config.js');
const sel = await modulo('selezione.js');
const stat = await modulo('statistiche.js');
const { creaTentativo, riepilogoSimulazione } = await modulo('punteggio.js');
const archivio = await modulo('archivio.js');

const catalogo = leggi('catalogo.json');
impostaDati(catalogo, catalogo.lezioni.filter(l => l.domande).map(l => leggi(l.domande)));

let prove = 0;
function prova(nome, f) {
  f();
  prove++;
  console.log('ok ', nome);
}

/** Generatore casuale ripetibile. */
function seme(s) {
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const tentativo = (idDomanda, esito, quando, extra = {}) =>
  ({ domanda: idDomanda, tipo: dati.domande.get(idDomanda).tipo, esito, errore: null, secondi: 30, modalita: 'allenamento', sessione: 's', quando, ...extra });

prova('simulazione: 14 multiple e 1 aperta, vincoli di copertura, ordine del programma', () => {
  const casuale = seme(7);
  const frequenze = { alta: 0, media: 0, bassa: 0 };
  for (let giro = 0; giro < 400; giro++) {
    const domande = sel.componiSimulazione([], casuale);
    assert.equal(domande.length, 15);
    assert.equal(domande.filter(d => d.formato === 'aperta').length, 1);
    const tipi = domande.map(d => dati.tipi.get(d.tipo));
    assert.equal(new Set(tipi).size, 15, 'mai due volte lo stesso tipo');
    const perLezione = new Map();
    for (const t of tipi) perLezione.set(t.lezione, (perLezione.get(t.lezione) ?? 0) + 1);
    assert.ok(Math.max(...perLezione.values()) <= CONFIG.maxPerLezione, 'al massimo 2 per lezione');
    assert.ok(perLezione.size >= CONFIG.minLezioni, `almeno 10 lezioni, trovate ${perLezione.size}`);
    for (let i = 1; i < tipi.length; i++) assert.ok(tipi[i - 1].lezione <= tipi[i].lezione, 'ordine delle lezioni');
    for (const t of tipi) frequenze[t.frequenza]++;
  }
  // I tipi ad alta frequenza sono 31 su 230 ma pesano il doppio dei medi: devono uscire ben più del 13%.
  const quota = frequenze.alta / (frequenze.alta + frequenze.media + frequenze.bassa);
  assert.ok(quota > 0.2, `quota di frequenza alta ${quota.toFixed(2)}`);
});

prova('varianti: prima quelle mai viste, poi la meno recente', () => {
  const tipo = 'L09-T08';
  const tutte = dati.perTipo.get(tipo);
  const viste = tutte.slice(0, -1).map((d, i) => tentativo(d.id, 'giusta', `2026-11-0${i + 1}T10:00:00Z`));
  assert.equal(sel.scegliVariante(tipo, sel.ultimaVolta(viste)).id, tutte[tutte.length - 1].id);
  const tutteViste = tutte.map((d, i) => tentativo(d.id, 'giusta', `2026-11-${10 + i}T10:00:00Z`));
  tutteViste.push(tentativo(tutte[0].id, 'giusta', '2026-11-25T10:00:00Z'));
  assert.equal(sel.scegliVariante(tipo, sel.ultimaVolta(tutteViste)).id, tutte[1].id);
});

prova('allenamento: i tipi si alternano e le domande non si ripetono', () => {
  const tipi = ['L09-T08', 'L09-T07', 'L12-T01'];
  const gen = sel.creaAllenamento(tipi, [], seme(3));
  const uscite = [];
  for (let d; (d = gen.prossima());) uscite.push(d);
  assert.equal(uscite.length, gen.totale);
  assert.equal(new Set(uscite.map(d => d.id)).size, uscite.length);
  const primoGiro = uscite.slice(0, 3).map(d => d.tipo).sort();
  assert.deepEqual(primoGiro, [...tipi].sort());
  for (let i = 1; i < 12; i++) assert.notEqual(uscite[i].tipo, uscite[i - 1].tipo, 'mai due dello stesso tipo di fila');
});

prova('coda del ripasso: 1, 3 e 7 giorni, poi la domanda esce', () => {
  const id = 'L09-T08-01';
  const giorno = g => `2026-11-${String(g).padStart(2, '0')}T12:00:00`;
  const registro = [tentativo(id, 'sbagliata', giorno(1))];
  const voce = () => sel.calcolaCoda(registro).get(id);
  assert.deepEqual(voce(), { casella: 1, scadenza: '2026-11-02', tipo: 'L09-T08' });

  registro.push(tentativo(id, 'giusta', giorno(1)));          // giusta troppo presto: non conta
  assert.equal(voce().casella, 1);
  registro.push(tentativo(id, 'giusta', giorno(2)));          // dopo 1 giorno → casella 2, tra 3 giorni
  assert.deepEqual([voce().casella, voce().scadenza], [2, '2026-11-05']);
  registro.push(tentativo(id, 'giusta', giorno(6)));          // → casella 3, tra 7 giorni
  assert.deepEqual([voce().casella, voce().scadenza], [3, '2026-11-13']);
  registro.push(tentativo(id, 'bianca', giorno(14)));         // in bianco: torna alla prima casella
  assert.deepEqual([voce().casella, voce().scadenza], [1, '2026-11-15']);
  registro.push(tentativo(id, 'giusta', giorno(15)), tentativo(id, 'giusta', giorno(18)), tentativo(id, 'giusta', giorno(25)));
  assert.equal(voce(), undefined, 'dopo la terza risposta giusta esce dalla coda');

  assert.equal(sel.inScadenza([tentativo(id, 'sbagliata', giorno(1))], new Date(2026, 10, 1)).length, 0);
  assert.equal(sel.inScadenza([tentativo(id, 'sbagliata', giorno(1))], new Date(2026, 10, 2)).length, 1);
});

prova('priorità: (1 − accuratezza recente) × peso, 0,5 per i tipi mai provati', () => {
  const alta = [...dati.tipi.values()].find(t => t.frequenza === 'alta' && t.formato === 'multipla');
  const d = dati.perTipo.get(alta.id);
  const registro = [];
  for (let i = 0; i < 12; i++) registro.push(tentativo(d[i % d.length].id, i < 4 ? 'sbagliata' : 'giusta', `2026-10-${10 + i}T10:00:00Z`));
  const righe = sel.prioritaTipi(registro);
  const riga = righe.find(r => r.tipo.id === alta.id);
  assert.equal(riga.tentativi, 12);
  assert.equal(riga.recenti, 10);
  assert.ok(Math.abs(riga.accuratezza - 0.8) < 1e-9, 'contano solo gli ultimi 10: 2 sbagliate su 10');
  assert.ok(Math.abs(riga.priorita - 0.2 * 3) < 1e-9);
  const maiProvato = righe.find(r => r.tentativi === 0 && r.tipo.frequenza === 'media');
  assert.equal(maiProvato.priorita, 0.5 * 1.5);
});

prova('ripasso: al più 6 dalla coda, il resto dai tipi deboli, 10 in tutto', () => {
  const registro = [];
  const sbagliate = [...dati.domande.values()].filter(d => d.formato === 'multipla').slice(0, 9);
  for (const d of sbagliate) registro.push(tentativo(d.id, 'sbagliata', '2026-11-01T10:00:00'));
  const r = sel.componiRipasso(registro, new Date(2026, 10, 3), seme(5));
  assert.equal(r.domande.length, 10);
  assert.equal(r.dallaCoda, 6);
  assert.equal(r.daiTipiDeboli, 4);
  assert.equal(new Set(r.domande.map(d => d.id)).size, 10);
  assert.ok(r.domande.filter(d => d.formato === 'aperta').length <= 1);

  const vuoto = sel.componiRipasso([], new Date(), seme(5));
  assert.equal(vuoto.domande.length, 10);
  assert.equal(vuoto.dallaCoda, 0);
  assert.ok(vuoto.domande.every(d => dati.tipi.get(d.tipo).frequenza === 'alta'), 'senza storico escono i tipi più frequenti');
});

prova('punteggio: +2, −1, 0 e domanda aperta da valutare', () => {
  const multipla = [...dati.domande.values()].find(d => d.formato === 'multipla');
  const aperta = [...dati.domande.values()].find(d => d.formato === 'aperta');
  const base = { secondi: 10, modalita: 'simulazione', sessione: 'x', quando: '2026-11-04T18:05:12Z' };
  const sbagliata = (multipla.corretta + 1) % 4;
  const lista = [
    creaTentativo(multipla, { ...base, scelta: multipla.corretta }),
    creaTentativo(multipla, { ...base, scelta: sbagliata, incerta: true }),
    creaTentativo(multipla, { ...base }),
    creaTentativo(aperta, { ...base, testo: 'def f(): pass' }),
  ];
  assert.deepEqual(lista.map(t => t.esito), ['giusta', 'sbagliata', 'bianca', 'aperta-0']);
  assert.equal(lista[1].errore, multipla.errori[sbagliata]);
  assert.equal(lista[3].daValutare, true);
  assert.deepEqual(riepilogoSimulazione(lista), { punteggio: 1, giuste: 1, sbagliate: 1, bianche: 1, aperta: 0, apertaDaValutare: true, superata: false });
  assert.equal(creaTentativo(aperta, { ...base, punti: 2 }).esito, 'aperta-2');
});

prova('statistiche: lezioni, argomenti, trappole, altri numeri', () => {
  const d = dati.perTipo.get('L09-T08');
  const registro = [
    tentativo(d[0].id, 'sbagliata', '2026-11-01T10:00:00Z', { errore: 'E1', modalita: 'simulazione', incerta: true, secondi: 50 }),
    tentativo(d[1].id, 'sbagliata', '2026-11-02T10:00:00Z', { errore: 'E1', modalita: 'simulazione', secondi: 70 }),
    tentativo(d[2].id, 'sbagliata', '2026-11-03T10:00:00Z', { errore: 'altro' }),
    tentativo(d[3].id, 'giusta', '2026-11-04T10:00:00Z', { modalita: 'simulazione', incerta: true, secondi: 30 }),
    tentativo(d[4].id, 'bianca', '2026-11-05T10:00:00Z', { modalita: 'simulazione', secondi: 10 }),
  ];
  const lezione9 = stat.perLezione(registro).find(l => l.lezione === 9);
  assert.deepEqual([lezione9.risposte, lezione9.accuratezza], [5, 0.2]);
  assert.equal(stat.perLezione(registro).find(l => l.lezione === 1).accuratezza, null);
  assert.equal(stat.perArgomento(registro)[0].argomento, 'Tracce delle operazioni');
  const [t] = stat.trappole(registro);
  assert.deepEqual([t.codice, t.volte, t.erroriDelTipo], ['E1', 2, 3]);
  assert.equal(t.testo, dati.tipi.get('L09-T08').trappole[0]);
  const altri = stat.altriNumeri(registro);
  assert.equal(altri.secondiPerDomanda, 40);
  assert.equal(altri.bianche, 0.25);
  assert.deepEqual(altri.incerte, { numero: 2, giuste: 1, saldo: 1 });
  assert.equal(stat.tipiDeboli(registro)[0].tipo.id, 'L09-T08');
  assert.deepEqual(stat.mediaMobile([{ punteggio: 10 }, { punteggio: 20 }, { punteggio: 30 }], 2), [10, 15, 25]);
});

prova('archivio: esporta e importa senza duplicare', () => {
  const d = dati.perTipo.get('L09-T08');
  archivio.aggiungiTentativi([tentativo(d[0].id, 'giusta', '2026-11-01T10:00:00Z')]);
  const copia = JSON.parse(JSON.stringify(archivio.esporta()));
  copia.tentativi.push(tentativo(d[1].id, 'sbagliata', '2026-10-01T10:00:00Z'));
  copia.simulazioni.push({ sessione: 'vecchia', quando: '2026-10-01T10:00:00Z', punteggio: 20 });
  assert.deepEqual(archivio.importa(copia), { tentativi: 1, simulazioni: 1 });
  assert.deepEqual(archivio.importa(copia), { tentativi: 0, simulazioni: 0 });
  assert.equal(archivio.tentativi()[0].quando, '2026-10-01T10:00:00Z', 'ordinati per data');
  assert.throws(() => archivio.importa({ app: 'altro' }));
  archivio.azzera();
  assert.equal(archivio.tentativi().length, 0);
});

console.log(`\n${prove} prove superate`);
