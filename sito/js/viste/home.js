// Home: ultimo punteggio e media, i tre tipi più deboli, le quattro modalità.

import { CONFIG } from '../config.js';
import { dati } from '../dati.js';
import * as archivio from '../archivio.js';
import { inScadenza } from '../selezione.js';
import { riepilogoAndamento, tipiDeboli } from '../statistiche.js';
import { el, aggiungi, voto, numero, percento, formatData } from '../util.js';
import { avviaAllenamento } from './pratica.js';

export function riquadro(etichetta, valore, nota) {
  return el('div.riquadro', {}, el('div.etichetta', {}, etichetta), el('div.valore', {}, valore), nota ? el('div.nota', {}, nota) : null);
}

function modalita(indirizzo, titolo, descrizione, distintivo) {
  return el('a.modalita', { href: indirizzo },
    el('span.titolo', {}, titolo, distintivo ? el('span.distintivo', {}, distintivo) : null),
    el('span.descrizione', {}, descrizione));
}

export function vistaHome(radice) {
  const tentativi = archivio.tentativi();
  const andamento = riepilogoAndamento(archivio.simulazioni());
  const scadute = inScadenza(tentativi).length;
  const deboli = tipiDeboli(tentativi);
  const inCorso = archivio.sessioneInCorso();
  const minuti = archivio.impostazioni().minuti;

  aggiungi(radice, 
    el('section.intro', {},
      el('h1', {}, 'Allenati allo sbarramento di Algoritmi 1'),
      el('p.tenue', {}, `${dati.domande.size} domande su ${dati.lezioni.length} lezioni. 15 domande in 15 minuti, +2 se giusta, −1 se sbagliata, 0 in bianco: si passa con ${CONFIG.soglia} su ${CONFIG.massimo}.`)),

    inCorso ? el('a.richiamo', { href: '#/simulazione' }, el('strong', {}, 'Hai una simulazione in corso. '), 'Il tempo continua a scorrere: riprendila →') : null,

    andamento
      ? el('section.riquadri', { 'aria-label': 'I tuoi risultati' },
        riquadro('Ultima simulazione', `${voto(andamento.ultimo.punteggio)}/${CONFIG.massimo}`,
          `${andamento.ultimo.punteggio >= CONFIG.soglia ? '✓ Superata' : '✗ Non superata'} · ${formatData(andamento.ultimo.quando)}`),
        riquadro(andamento.quanteInMedia > 1 ? `Media delle ultime ${andamento.quanteInMedia}` : 'Media', numero(andamento.mediaUltime),
          `${percento(andamento.superate)} superate su ${andamento.numero}`),
        riquadro('Ripasso di oggi', scadute, scadute === 1 ? 'domanda in scadenza' : 'domande in scadenza'))
      : el('section.vuoto-iniziale', {},
        el('p', {}, 'Non hai ancora fatto simulazioni. Comincia da una simulazione per vedere a che punto sei: qui compariranno il tuo punteggio e i tipi di domanda da ripassare.')),

    el('nav.modi', { 'aria-label': 'Modalità' },
      modalita('#/simulazione', 'Simulazione', `Come il test vero: 14 domande a risposta multipla e una aperta, ${minuti} minuti.`),
      modalita('#/allenamento', 'Allenamento mirato', 'Scegli lezioni, argomenti o tipi. Senza tempo, con la spiegazione dopo ogni risposta.'),
      modalita('#/ripasso', 'Ripasso errori', 'Dieci domande: quelle che hai sbagliato e i tipi in cui vai peggio.', scadute ? `${scadute} in scadenza` : null),
      modalita('#/statistiche', 'Statistiche', 'Stai migliorando? Dove sbagli? Come sbagli?')),

    deboli.length
      ? el('section', {},
        el('h2', {}, deboli.length === 1 ? 'Il tipo di domanda in cui sbagli di più' : `I ${deboli.length} tipi di domanda in cui sbagli di più`),
        el('ul.elenco', {}, deboli.map(r => el('li', {},
          el('button.riga-tipo', { type: 'button', onclick: () => avviaAllenamento([r.tipo.id], r.tipo.titolo) },
            el('span.nome', {}, r.tipo.titolo),
            el('span.dettaglio', {}, `Lezione ${r.tipo.lezione} · ${percento(r.accuratezza)} di risposte giuste nelle ultime ${r.recenti}`),
            el('span.azione', { 'aria-hidden': 'true' }, 'Allenati →'))))))
      : null,

    el('p.avvertenza', {}, 'Sito non ufficiale, fatto da studenti: non è collegato al corso né ai docenti. Le tue risposte restano solo in questo browser.'));
}
