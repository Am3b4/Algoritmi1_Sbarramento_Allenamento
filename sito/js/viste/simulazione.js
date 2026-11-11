// Simulazione: 15 domande, cronometro, consegna automatica allo scadere del tempo.

import { CONFIG } from '../config.js';
import { dati } from '../dati.js';
import * as archivio from '../archivio.js';
import { componiSimulazione } from '../selezione.js';
import { creaTentativo, riepilogoSimulazione } from '../punteggio.js';
import { el, aggiungi, sostituisci, mescola, idSessione, formatDurata, conferma, finestraAperta, vai, ridisegna } from '../util.js';
import { corpoDomanda } from '../contenuti.js';
import { gruppoOpzioni } from '../scheda.js';

function nuovaSessione() {
  const domande = componiSimulazione(archivio.tentativi());
  const adesso = Date.now();
  const minuti = archivio.impostazioni().minuti;
  const s = {
    id: idSessione(),
    domande: domande.map(d => d.id),
    ordini: {},    // per ogni domanda, l'ordine mescolato delle opzioni
    risposte: {},  // per ogni domanda: {scelta, incerta, testo}
    tempi: {},     // secondi passati su ogni domanda
    indice: 0,
    inizio: adesso,
    scadenza: adesso + minuti * 60000,
    durata: minuti * 60,
  };
  for (const d of domande) {
    if (d.formato === 'multipla') s.ordini[d.id] = mescola([0, 1, 2, 3]);
    s.risposte[d.id] = { scelta: null, incerta: false, testo: '' };
    s.tempi[d.id] = 0;
  }
  return s;
}

const risposta = (s, d) => (d.formato === 'multipla' ? s.risposte[d.id].scelta != null : s.risposte[d.id].testo.trim() !== '');

/** Registra i tentativi e il riepilogo, poi apre la correzione. */
function consegna(s, tempoScaduto) {
  const quando = new Date().toISOString();
  const tentativi = s.domande.map(id => {
    const r = s.risposte[id];
    return creaTentativo(dati.domande.get(id), {
      scelta: r.scelta, incerta: r.incerta, testo: r.testo,
      secondi: Math.round(s.tempi[id]), modalita: 'simulazione', sessione: s.id, quando,
    });
  });
  archivio.aggiungiTentativi(tentativi);
  archivio.aggiungiSimulazione({
    sessione: s.id,
    quando,
    ...riepilogoSimulazione(tentativi),
    secondi: Math.min(s.durata, Math.round((Date.now() - s.inizio) / 1000)),
    durata: s.durata,
    tempoScaduto,
    domande: s.domande,
  });
  archivio.cancellaSessione();
  vai(`#/correzione/${encodeURIComponent(s.id)}`);
}

function introduzione(radice) {
  const minuti = archivio.impostazioni().minuti;
  aggiungi(radice, 
    el('h1', {}, 'Simulazione'),
    el('ul.regole', {},
      el('li', {}, '15 domande nell\'ordine del programma: 14 a risposta multipla e una aperta (una funzione ricorsiva da scrivere).'),
      el('li', {}, `${minuti} minuti. Allo scadere la prova si consegna da sola.`),
      el('li', {}, `Risposta giusta +2, sbagliata −1, in bianco 0. Si passa con ${CONFIG.soglia} su ${CONFIG.massimo}.`),
      el('li', {}, 'Puoi saltare avanti e indietro tra le domande e segnare quelle su cui non sei sicuro.'),
      el('li', {}, 'La domanda aperta la valuti tu dopo la consegna, confrontandola con la soluzione. Puoi scriverla anche su carta.')),
    el('p.tenue', {}, 'Da tastiera: 1–4 per scegliere, Invio per passare alla domanda successiva, frecce ← → per spostarti.'),
    el('div.azioni', {},
      el('button.btn.primario.grande', {
        type: 'button',
        onclick: () => {
          archivio.salvaSessione(nuovaSessione());
          ridisegna();
        },
      }, 'Inizia la simulazione')));
}

function svolgimento(radice, s) {
  const n = s.domande.length;
  let ultimoIstante = Date.now();
  let chiusa = false;
  let salvataggio = null;

  /** Somma alla domanda corrente il tempo passato dall'ultima volta. */
  function contaTempo() {
    const adesso = Date.now();
    s.tempi[s.domande[s.indice]] += (adesso - ultimoIstante) / 1000;
    ultimoIstante = adesso;
  }
  function salva() {
    contaTempo();
    archivio.salvaSessione(s);
  }
  function chiudi(tempoScaduto) {
    contaTempo();
    chiusa = true;
    consegna(s, tempoScaduto);
  }

  const orologio = el('span.orologio', { role: 'timer', 'aria-label': 'Tempo rimasto' });
  function aggiornaOrologio() {
    const rimasti = Math.max(0, (s.scadenza - Date.now()) / 1000);
    orologio.textContent = formatDurata(Math.ceil(rimasti));
    orologio.classList.toggle('poco', rimasti <= 120);
    if (rimasti <= 0 && !chiusa) chiudi(true);
  }
  const battito = setInterval(aggiornaOrologio, 500);

  async function chiediConsegna() {
    const bianche = s.domande.filter(id => !risposta(s, dati.domande.get(id))).length;
    const testo = bianche === 0 ? 'Hai risposto a tutte le domande.'
      : bianche === 1 ? 'Hai lasciato 1 domanda in bianco.' : `Hai lasciato ${bianche} domande in bianco.`;
    if (await conferma({ titolo: 'Consegnare la prova?', testo, ok: 'Consegna', annulla: 'Continua' }) && !chiusa) chiudi(false);
  }

  function vaiA(indice) {
    if (indice < 0 || indice >= n) return;
    salva();
    s.indice = indice;
    disegna();
    window.scrollTo(0, 0);
  }

  let opzioni = null;
  let caselle = [];

  function aggiornaCasella(i) {
    const d = dati.domande.get(s.domande[i]);
    const r = s.risposte[d.id];
    const data = risposta(s, d);
    const c = caselle[i];
    c.classList.toggle('data', data);
    c.classList.toggle('incerta', r.incerta);
    c.classList.toggle('corrente', i === s.indice);
    c.setAttribute('aria-current', i === s.indice ? 'true' : 'false');
    c.setAttribute('aria-label', `Domanda ${i + 1}: ${data ? 'risposta data' : 'in bianco'}${r.incerta ? ', non sicuro' : ''}`);
    c.lastChild.textContent = r.incerta ? '?' : data ? '✓' : '';
  }

  function scegli(indiceOpzione) {
    const d = dati.domande.get(s.domande[s.indice]);
    if (d.formato !== 'multipla') return;
    const r = s.risposte[d.id];
    r.scelta = r.scelta === indiceOpzione ? null : indiceOpzione; // toccare di nuovo toglie la risposta
    opzioni.seleziona(r.scelta);
    aggiornaCasella(s.indice);
    salva();
  }

  function disegna() {
    const d = dati.domande.get(s.domande[s.indice]);
    const r = s.risposte[d.id];
    const ultima = s.indice === n - 1;

    caselle = s.domande.map((_, i) => el('button.casella', { type: 'button', onclick: () => vaiA(i) },
      el('span', {}, i + 1), el('span.segno', { 'aria-hidden': 'true' })));

    let risposte;
    if (d.formato === 'multipla') {
      opzioni = gruppoOpzioni(d, s.ordini[d.id], { scelta: r.scelta, alScegliere: scegli });
      risposte = opzioni.nodo;
    } else {
      opzioni = null;
      risposte = el('div.scrittura', {},
        el('label', { for: 'risposta-aperta' }, 'La tua funzione (puoi anche scriverla su carta: la valuterai dopo la consegna)'),
        el('textarea', {
          id: 'risposta-aperta', rows: 10, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off',
          placeholder: 'def funzione(...):',
          oninput: e => {
            r.testo = e.target.value;
            aggiornaCasella(s.indice);
            clearTimeout(salvataggio);
            salvataggio = setTimeout(salva, 800);
          },
          onkeydown: e => {
            if (e.key === 'Tab' && !e.shiftKey) { // Tab rientra di quattro spazi; Esc lascia il riquadro
              e.preventDefault();
              e.target.setRangeText('    ', e.target.selectionStart, e.target.selectionEnd, 'end');
              e.target.dispatchEvent(new Event('input'));
            } else if (e.key === 'Escape') e.target.blur();
          },
        }, r.testo));
    }

    const incerta = el('button.btn.interruttore', {
      type: 'button',
      'aria-pressed': String(r.incerta),
      onclick: () => {
        r.incerta = !r.incerta;
        incerta.setAttribute('aria-pressed', String(r.incerta));
        aggiornaCasella(s.indice);
        salva();
      },
    }, 'Non sono sicuro');

    sostituisci(radice, 
      el('div.barra-simulazione', {},
        orologio,
        el('span.posizione', {}, `Domanda ${s.indice + 1} di ${n}`),
        el('button.btn.primario', { type: 'button', onclick: chiediConsegna }, 'Consegna')),
      el('nav.griglia', { 'aria-label': 'Domande della prova' }, caselle),
      el('article.scheda', {},
        el('h1.numero', {}, `Domanda ${s.indice + 1}`, d.formato === 'aperta' ? el('span.tenue', {}, ' · domanda aperta') : null),
        corpoDomanda(d),
        risposte,
        el('div.azioni.sotto-domanda', {},
          d.formato === 'multipla'
            ? el('button.btn', { type: 'button', onclick: () => r.scelta != null && scegli(r.scelta) }, 'Lascia in bianco')
            : null,
          incerta)),
      el('div.azioni.navigazione', {},
        el('button.btn', { type: 'button', disabled: s.indice === 0, onclick: () => vaiA(s.indice - 1) }, '← Precedente'),
        ultima
          ? el('button.btn.primario', { type: 'button', onclick: chiediConsegna }, 'Consegna')
          : el('button.btn.primario', { type: 'button', onclick: () => vaiA(s.indice + 1) }, 'Successiva →')));
    s.domande.forEach((_, i) => aggiornaCasella(i));
  }

  function tasto(e) {
    if (finestraAperta() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches?.('textarea, input')) return;
    const d = dati.domande.get(s.domande[s.indice]);
    const posto = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
    if (posto >= 0 && d.formato === 'multipla') scegli(s.ordini[d.id][posto]);
    else if (e.key === 'ArrowRight') vaiA(s.indice + 1);
    else if (e.key === 'ArrowLeft') vaiA(s.indice - 1);
    else if (e.key === 'Enter' && !e.target.matches?.('button, a')) {
      if (s.indice === n - 1) chiediConsegna();
      else vaiA(s.indice + 1);
    } else return;
    e.preventDefault();
  }

  document.addEventListener('keydown', tasto);
  document.body.classList.add('in-simulazione');
  disegna();
  aggiornaOrologio();

  return () => {
    clearInterval(battito);
    clearTimeout(salvataggio);
    document.removeEventListener('keydown', tasto);
    document.body.classList.remove('in-simulazione');
    document.querySelector('dialog[open]')?.close('no');
    if (!chiusa) salva(); // si esce senza consegnare: la prova resta in corso e il tempo continua
  };
}

export function vistaSimulazione(radice) {
  let s = archivio.sessioneInCorso();
  if (s && !s.domande.every(id => dati.domande.has(id))) {
    archivio.cancellaSessione(); // l'archivio delle domande è cambiato: la prova non si può riprendere
    s = null;
  }
  if (!s) return introduzione(radice);
  if (Date.now() >= s.scadenza) {
    consegna(s, true); // il tempo è scaduto mentre la pagina era chiusa
    return undefined;
  }
  return svolgimento(radice, s);
}
