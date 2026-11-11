// Correzione di una sessione: punteggio ed esito, poi ogni domanda con risposta data,
// risposta giusta e spiegazione. Funziona per le simulazioni e per le sessioni di pratica,
// anche riaperte dallo storico: tutto si ricostruisce dal registro dei tentativi.

import { CONFIG } from '../config.js';
import * as archivio from '../archivio.js';
import { riepilogoSimulazione, frazione } from '../punteggio.js';
import { el, aggiungi, voto, formatDataOra, formatDurata, ridisegna } from '../util.js';
import { schedaCorrezione } from '../scheda.js';
import { riquadro } from './home.js';

export function vistaCorrezione(radice, idSessione) {
  const simulazione = archivio.simulazioni().find(s => s.sessione === idSessione);
  let tentativi = archivio.tentativiDi(idSessione);
  if (!tentativi.length) {
    aggiungi(radice, 
      el('h1', {}, 'Sessione non trovata'),
      el('p', {}, 'Non ci sono risposte registrate per questa sessione.'),
      el('div.azioni', {}, el('a.btn.primario', { href: '#/' }, 'Torna alla home')));
    return;
  }
  if (simulazione?.domande) {
    const posto = new Map(simulazione.domande.map((id, i) => [id, i]));
    tentativi = [...tentativi].sort((a, b) => (posto.get(a.domanda) ?? 99) - (posto.get(b.domanda) ?? 99));
  }

  const valuta = (tentativo, voto) => {
    archivio.valutaAperta(idSessione, tentativo.domanda, voto);
    const y = window.scrollY;
    ridisegna();
    window.scrollTo(0, y);
  };

  if (simulazione) {
    const r = riepilogoSimulazione(tentativi);
    const daValutare = tentativi.find(t => t.daValutare);
    aggiungi(radice, 
      el('h1', {}, 'Correzione della simulazione'),
      el('p.tenue', {}, formatDataOra(simulazione.quando), simulazione.tempoScaduto ? ' · consegnata allo scadere del tempo' : ''),
      el('section.punteggio', { class: r.superata ? 'superata' : 'non-superata' },
        el('div.grande', {}, el('span.voto', {}, voto(r.punteggio)), el('span.su', {}, ` / ${CONFIG.massimo}`)),
        el('div.esito-prova', {}, r.superata ? '✓ Superata' : '✗ Non superata', el('span.tenue', {}, ` · soglia ${CONFIG.soglia}`))),
      daValutare
        ? el('a.richiamo', { href: `#d-${daValutare.domanda}`, onclick: e => {
          e.preventDefault(); // l'ancora cambierebbe l'indirizzo della schermata
          document.getElementById(`d-${daValutare.domanda}`)?.scrollIntoView({ behavior: 'smooth' });
        } }, el('strong', {}, 'Manca la domanda aperta. '), 'Confrontala con la soluzione e datti 0, 1 o 2 punti: il punteggio si aggiorna ↓')
        : null,
      el('section.riquadri', {},
        riquadro('Giuste', r.giuste, `+${r.giuste * 2} punti`),
        riquadro('Sbagliate', r.sbagliate, r.sbagliate ? `−${r.sbagliate} punti` : '0 punti'),
        riquadro('In bianco', r.bianche, '0 punti'),
        riquadro('Aperta', r.apertaDaValutare ? '?' : r.aperta ?? '–', r.apertaDaValutare ? 'da valutare' : 'punti su 2'),
        riquadro('Tempo', formatDurata(simulazione.secondi), `su ${formatDurata(simulazione.durata)}`)));
  } else {
    const giuste = tentativi.filter(t => frazione(t.esito) === 1).length;
    const ripasso = tentativi[0].modalita === 'ripasso';
    aggiungi(radice, 
      el('h1', {}, ripasso ? 'Ripasso finito' : 'Allenamento finito'),
      el('p.tenue', {}, formatDataOra(tentativi[0].quando)),
      el('section.riquadri', {},
        riquadro('Giuste', `${giuste} su ${tentativi.length}`, null),
        riquadro('Sbagliate', tentativi.filter(t => t.esito === 'sbagliata' || t.esito === 'aperta-0' || t.esito === 'aperta-1').length, null),
        riquadro('Non lo so', tentativi.filter(t => t.esito === 'bianca').length, null)),
      el('p.tenue', {}, 'Le domande sbagliate o lasciate in bianco torneranno nel ripasso tra un giorno.'));
  }

  aggiungi(radice, 
    el('div.azioni', {},
      el('a.btn', { href: '#/' }, 'Home'),
      el('a.btn', { href: '#/statistiche' }, 'Statistiche'),
      simulazione ? el('a.btn.primario', { href: '#/ripasso' }, 'Ripassa gli errori') : el('a.btn.primario', { href: '#/allenamento' }, 'Nuovo allenamento')),
    el('h2', {}, 'Le domande'),
    tentativi.map((t, i) => schedaCorrezione(t, {
      numero: i + 1,
      alValutare: voto => valuta(t, voto),
    })));
}
