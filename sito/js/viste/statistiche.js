// Statistiche, in tre domande: sto migliorando? dove sbaglio? come sbaglio?

import { CONFIG, ETICHETTE_FREQUENZA } from '../config.js';
import { dati, chiaveArgomento } from '../dati.js';
import * as archivio from '../archivio.js';
import * as stat from '../statistiche.js';
import { el, aggiungi, sostituisci, voto, numero, percento, conSegno, formatData, formatDataOra, formatDurata } from '../util.js';
import { graficoAndamento } from '../grafici.js';
import { schedaCorrezione } from '../scheda.js';
import { riquadro } from './home.js';
import { avviaAllenamento } from './pratica.js';

let livello = 'lezione'; // quale vista di "Dove sbaglio" è aperta

/** Barra sottile con la percentuale scritta accanto: il numero non dipende dal colore. */
function misura(accuratezza) {
  if (accuratezza == null) return el('span.misura.vuota', {}, el('span.tenue', {}, 'nessuna risposta'));
  return el('span.misura', {},
    el('span.barra', { 'aria-hidden': 'true' }, el('span', { style: `width:${Math.round(accuratezza * 100)}%` })),
    el('span.percentuale', {}, percento(accuratezza)));
}

/**
 * Riga che si apre: mostra le ultime domande del gruppo con la risposta data e la spiegazione,
 * e il pulsante per allenarsi su quel gruppo. Il contenuto si costruisce solo quando si apre.
 */
function rigaApribile({ titolo, sottotitolo, accuratezza, filtroTipo, etichetta }) {
  const corpo = el('div.dettaglio-riga');
  const riga = el('details.riga', {},
    el('summary', {},
      el('span.testi', {}, el('span.nome', {}, titolo), sottotitolo ? el('span.dettaglio', {}, sottotitolo) : null),
      misura(accuratezza)),
    corpo);
  riga.addEventListener('toggle', () => {
    if (!riga.open || corpo.childNodes.length) return;
    const tipi = [...dati.tipi.values()].filter(t => filtroTipo(t) && dati.perTipo.has(t.id));
    const ultimi = stat.ultimiTentativi(archivio.tentativi(), filtroTipo);
    aggiungi(corpo,
      el('div.azioni', {}, el('button.btn.primario', { type: 'button', onclick: () => avviaAllenamento(tipi.map(t => t.id), etichetta) }, 'Allenati su questo')),
      ultimi.length
        ? [el('h4', {}, ultimi.length === 1 ? 'L\'ultima risposta' : `Le ultime ${ultimi.length} risposte`), ultimi.map(t => schedaCorrezione(t))]
        : el('p.tenue', {}, 'Non hai ancora risposto a domande di questo gruppo.'));
  });
  return riga;
}

function doveSbaglio(tentativi) {
  const contenuto = el('div.livello');
  const risposte = n => (n === 1 ? '1 risposta' : `${n} risposte`);

  function mostra() {
    if (livello === 'lezione') {
      sostituisci(contenuto, ...stat.perLezione(tentativi).map(r => rigaApribile({
        titolo: `${r.lezione}. ${r.titolo}`,
        sottotitolo: r.risposte ? risposte(r.risposte) : null,
        accuratezza: r.accuratezza,
        filtroTipo: t => t.lezione === r.lezione,
        etichetta: `Lezione ${r.lezione}: ${r.titolo}`,
      })));
    } else if (livello === 'argomento') {
      const righe = stat.perArgomento(tentativi);
      sostituisci(contenuto, ...(righe.length ? righe.map(r => rigaApribile({
        titolo: r.argomento,
        sottotitolo: `Lezione ${r.lezione} · ${risposte(r.risposte)}`,
        accuratezza: r.accuratezza,
        filtroTipo: t => chiaveArgomento(t) === r.chiave,
        etichetta: r.argomento,
      })) : [el('p.tenue', {}, 'Ancora nessuna risposta.')]));
    } else {
      const righe = stat.perTipo(tentativi);
      const maiProvati = stat.tipiMaiProvati(tentativi);
      sostituisci(contenuto, 
        el('p.tenue', {}, 'In ordine di priorità di ripasso: prima i tipi in cui sbagli di più e che escono più spesso. La percentuale conta le ultime 10 risposte.'),
        ...righe.map(r => rigaApribile({
          titolo: r.tipo.titolo,
          sottotitolo: `Lezione ${r.tipo.lezione} · ${risposte(r.tentativi)} · ultima il ${formatData(r.ultimo)} · ${ETICHETTE_FREQUENZA[r.tipo.frequenza].toLowerCase()}`,
          accuratezza: r.accuratezza,
          filtroTipo: t => t.id === r.tipo.id,
          etichetta: r.tipo.titolo,
        })),
        maiProvati.length
          ? el('div.mai-provati', {},
            el('p', {}, `${maiProvati.length} tipi di domanda su ${dati.tipi.size} non li hai mai provati.`),
            el('button.btn', { type: 'button', onclick: () => avviaAllenamento(maiProvati.map(t => t.id), 'Tipi mai provati') }, 'Allenati sui tipi mai provati'))
          : null);
    }
  }

  const schede = [['lezione', 'Per lezione'], ['argomento', 'Per argomento'], ['tipo', 'Per tipo']].map(([valore, nome]) =>
    el('button', {
      type: 'button', role: 'tab', 'aria-selected': String(livello === valore),
      onclick: e => {
        livello = valore;
        for (const b of e.currentTarget.parentNode.children) b.setAttribute('aria-selected', String(b === e.currentTarget));
        mostra();
      },
    }, nome));
  mostra();
  return [el('div.schede', { role: 'tablist', 'aria-label': 'Livello di dettaglio' }, schede), contenuto];
}

function comeSbaglio(tentativi) {
  const tutte = stat.trappole(tentativi);
  if (!tutte.length) return el('p.tenue', {}, 'Quando sbagli una domanda, qui compare l\'errore tipico che porta a quella risposta, con il numero di volte in cui ci sei caduto.');
  const voce = t => el('li.trappola-riga', {},
    el('p.quanto', {}, el('strong', {}, t.volte === 1 ? '1 errore' : `${t.volte} errori`), ` su ${t.erroriDelTipo} in «${t.tipo.titolo}»`, el('span.tenue', {}, ` · Lezione ${t.tipo.lezione}`)),
    el('span.barra', { 'aria-hidden': 'true' }, el('span', { style: `width:${Math.round((t.volte / t.erroriDelTipo) * 100)}%` })),
    el('p.testo-trappola', {}, t.testo),
    el('button.btn.piccolo', { type: 'button', onclick: () => avviaAllenamento([t.tipo.id], t.tipo.titolo) }, 'Allenati su questo tipo'));
  const elenco = el('ul.trappole', {}, tutte.slice(0, 8).map(voce));
  const altre = tutte.length > 8
    ? el('button.btn', { type: 'button', onclick: e => { elenco.append(...tutte.slice(8).map(voce)); e.currentTarget.remove(); } }, `Mostra le altre ${tutte.length - 8}`)
    : null;
  return [elenco, altre];
}

function storico(simulazioni) {
  return el('details.storico', {},
    el('summary', {}, `Storico delle simulazioni (${simulazioni.length})`),
    el('div.scorri', {}, el('table', {},
      el('thead', {}, el('tr', {}, ['Data', 'Punti', 'Esito', 'Tempo', ''].map(t => el('th', { scope: 'col' }, t)))),
      el('tbody', {}, [...simulazioni].reverse().map(s => el('tr', {},
        el('td', {}, formatDataOra(s.quando)),
        el('td.num', {}, voto(s.punteggio)),
        el('td', {}, s.punteggio >= CONFIG.soglia ? '✓ Superata' : '✗ Non superata', s.apertaDaValutare ? ' (aperta da valutare)' : ''),
        el('td.num', {}, formatDurata(s.secondi)),
        el('td', {}, el('a', { href: `#/correzione/${encodeURIComponent(s.sessione)}` }, 'Rivedi'))))))));
}

export function vistaStatistiche(radice) {
  const tentativi = archivio.tentativi();
  const simulazioni = archivio.simulazioni();
  const andamento = stat.riepilogoAndamento(simulazioni);
  const altri = stat.altriNumeri(tentativi);

  aggiungi(radice, el('h1', {}, 'Statistiche'));
  if (!tentativi.length) {
    aggiungi(radice, 
      el('p', {}, 'Qui vedrai l\'andamento delle simulazioni, le lezioni e i tipi di domanda in cui sbagli di più e gli errori tipici in cui cadi. Per ora non hai ancora risposto a nessuna domanda.'),
      el('div.azioni', {}, el('a.btn.primario', { href: '#/simulazione' }, 'Fai una simulazione'), el('a.btn', { href: '#/allenamento' }, 'Allenati su un argomento')));
    return;
  }

  aggiungi(radice, 
    el('section', {},
      el('h2', {}, 'Sto migliorando?'),
      andamento
        ? [
          el('div.riquadri', {},
            riquadro('Ultimo punteggio', `${voto(andamento.ultimo.punteggio)}/${CONFIG.massimo}`, andamento.ultimo.punteggio >= CONFIG.soglia ? '✓ Superata' : '✗ Non superata'),
            riquadro(andamento.quanteInMedia > 1 ? `Media delle ultime ${andamento.quanteInMedia}` : 'Media', numero(andamento.mediaUltime), `soglia ${CONFIG.soglia}`),
            riquadro('Simulazioni superate', percento(andamento.superate), `su ${andamento.numero}`)),
          el('h3.titolo-grafico', {}, `Punteggio delle simulazioni (su ${CONFIG.massimo})`),
          graficoAndamento(simulazioni),
          storico(simulazioni),
        ]
        : el('p.tenue', {}, 'Non hai ancora fatto simulazioni: il grafico dei punteggi comparirà dopo la prima.')),

    el('section', {}, el('h2', {}, 'Dove sbaglio?'), doveSbaglio(tentativi)),
    el('section', {}, el('h2', {}, 'Come sbaglio?'), comeSbaglio(tentativi)),

    el('section', {},
      el('h2', {}, 'Altri numeri'),
      altri.risposteSimulazione
        ? el('div.riquadri.larghi', {},
          riquadro('Tempo medio per domanda', `${Math.round(altri.secondiPerDomanda)} s`, altri.secondiPerDomanda <= 60 ? '✓ sotto i 60 secondi' : '✗ deve stare sotto i 60 secondi'),
          riquadro('Risposte in bianco', percento(altri.bianche), 'in simulazione'),
          riquadro('Saldo delle risposte incerte', altri.incerte.numero ? `${conSegno(altri.incerte.saldo)} punti` : '–',
            altri.incerte.numero
              ? `${altri.incerte.giuste} giuste su ${altri.incerte.numero} segnate «non sono sicuro»`
              : 'segna «non sono sicuro» in simulazione per misurarlo'))
        : el('p.tenue', {}, 'Tempo per domanda, risposte in bianco e saldo delle risposte incerte si calcolano sulle simulazioni.')));
}
