// Allenamento mirato e ripasso degli errori: una domanda alla volta, senza tempo,
// con la correzione subito dopo ogni risposta.

import { ETICHETTE_FREQUENZA } from '../config.js';
import { dati, tipiConDomande, titoloLezione } from '../dati.js';
import * as archivio from '../archivio.js';
import { creaAllenamento, componiRipasso, inScadenza } from '../selezione.js';
import { creaTentativo } from '../punteggio.js';
import { el, aggiungi, sostituisci, mescola, idSessione, finestraAperta, vai } from '../util.js';
import { corpoDomanda } from '../contenuti.js';
import { gruppoOpzioni, intestazioneTipo, bloccoSpiegazione, bloccoAperta, pulsanteSegnala, etichettaEsito } from '../scheda.js';

let sessione = null; // la sessione di pratica in corso; non sopravvive alla chiusura della pagina (le risposte sì)

export function avviaAllenamento(idTipi, etichetta) {
  sessione = {
    id: idSessione(), modalita: 'allenamento', etichetta,
    generatore: creaAllenamento(idTipi, archivio.tentativi()),
    fatte: 0, giuste: 0, totale: null, attuale: null,
  };
  vai('#/pratica');
}

function avviaRipasso() {
  const { domande } = componiRipasso(archivio.tentativi());
  sessione = {
    id: idSessione(), modalita: 'ripasso', etichetta: 'Ripasso errori',
    coda: domande, fatte: 0, giuste: 0, totale: domande.length, attuale: null,
  };
  vai('#/pratica');
}

// ---------- una domanda alla volta ----------

export function vistaPratica(radice) {
  if (!sessione) {
    vai('#/allenamento');
    return undefined;
  }
  const s = sessione;

  function fine() {
    sessione = null;
    vai(s.fatte ? `#/correzione/${encodeURIComponent(s.id)}` : '#/');
  }

  function prossima() {
    const d = s.generatore ? s.generatore.prossima() : s.coda.shift();
    if (!d) return fine();
    s.attuale = { d, ordine: mescola([0, 1, 2, 3]), scelta: null, testo: '', inizio: Date.now(), tentativo: null, soluzione: false };
    disegna();
    window.scrollTo(0, 0);
    return undefined;
  }

  /** Salva subito la risposta: se la pagina si chiude non si perde nulla. */
  function registra(dettagli) {
    const a = s.attuale;
    a.tentativo = creaTentativo(a.d, {
      ...dettagli,
      secondi: Math.round((Date.now() - a.inizio) / 1000),
      modalita: s.modalita, sessione: s.id, quando: new Date().toISOString(),
    });
    archivio.aggiungiTentativi([a.tentativo]);
    s.fatte++;
    if (a.tentativo.esito === 'giusta' || a.tentativo.esito === 'aperta-2') s.giuste++;
    disegna();
  }

  let opzioni = null;
  let conferma = null;

  function scegli(indice) {
    const a = s.attuale;
    if (a.tentativo || a.d.formato !== 'multipla') return;
    a.scelta = indice;
    opzioni.seleziona(indice);
    conferma.disabled = false;
  }

  function disegna() {
    const a = s.attuale;
    const d = a.d;
    const risposto = a.tentativo !== null;
    const corpo = [];

    if (d.formato === 'multipla') {
      opzioni = gruppoOpzioni(d, a.ordine, { scelta: risposto ? a.tentativo.scelta ?? null : a.scelta, corretta: risposto, alScegliere: scegli });
      corpo.push(opzioni.nodo);
      if (!risposto) {
        conferma = el('button.btn.primario', { type: 'button', disabled: a.scelta == null, onclick: () => registra({ scelta: a.scelta }) }, 'Conferma');
        corpo.push(el('div.azioni.sotto-domanda', {},
          el('button.btn', { type: 'button', onclick: () => registra({ scelta: null }) }, 'Non lo so'),
          conferma));
      }
    } else if (!risposto) {
      // Domanda aperta: si scrive (qui o su carta), si guarda la soluzione e ci si dà un voto.
      if (!a.soluzione) {
        corpo.push(
          el('div.scrittura', {},
            el('label', { for: 'risposta-aperta' }, 'La tua funzione (puoi anche scriverla su carta)'),
            el('textarea', {
              id: 'risposta-aperta', rows: 10, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off',
              placeholder: 'def funzione(...):',
              oninput: e => { a.testo = e.target.value; },
              onkeydown: e => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault();
                  e.target.setRangeText('    ', e.target.selectionStart, e.target.selectionEnd, 'end');
                  a.testo = e.target.value;
                } else if (e.key === 'Escape') e.target.blur();
              },
            }, a.testo)),
          el('div.azioni.sotto-domanda', {},
            el('button.btn.primario', { type: 'button', onclick: () => { a.soluzione = true; disegna(); } }, 'Mostra la soluzione')));
      } else {
        corpo.push(bloccoAperta(d, { risposta: a.testo, alValutare: voto => registra({ testo: a.testo, punti: voto }) }));
      }
    } else {
      corpo.push(bloccoAperta(d, {
        risposta: a.testo,
        voto: Number(a.tentativo.esito.slice(-1)),
        alValutare: voto => { // si può cambiare idea sul voto prima di andare avanti
          const prima = a.tentativo.esito === 'aperta-2';
          archivio.valutaAperta(s.id, d.id, voto);
          a.tentativo.esito = `aperta-${voto}`;
          s.giuste += (voto === 2) - prima;
          disegna();
        },
      }));
    }

    const avanti = risposto ? el('button.btn.primario.grande', { type: 'button', onclick: prossima }, 'Avanti →') : null;
    const conteggio = s.totale ? `Domanda ${s.fatte + (risposto ? 0 : 1)} di ${s.totale}` : `Domanda ${s.fatte + (risposto ? 0 : 1)}`;

    sostituisci(radice, 
      el('div.barra-pratica', {},
        el('span.posizione', {}, el('strong', {}, s.modalita === 'ripasso' ? 'Ripasso' : 'Allenamento'), ` · ${conteggio}`, s.fatte ? ` · ${s.giuste} giuste su ${s.fatte}` : ''),
        el('button.btn', { type: 'button', onclick: fine }, 'Termina')),
      el('article.scheda', {},
        risposto ? el('div.verdetto', { role: 'status' }, etichettaEsito(a.tentativo)) : null,
        risposto ? intestazioneTipo(d) : null,
        corpoDomanda(d),
        corpo,
        risposto ? bloccoSpiegazione(d, a.tentativo) : null,
        risposto ? pulsanteSegnala(d) : null),
      avanti ? el('div.azioni.navigazione', {}, avanti) : null);
    avanti?.focus({ preventScroll: true });
  }

  function tasto(e) {
    if (finestraAperta() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.matches?.('textarea, input')) return;
    const a = s.attuale;
    const posto = '1234'.indexOf(e.key) >= 0 ? '1234'.indexOf(e.key) : 'abcd'.indexOf(e.key.toLowerCase());
    if (posto >= 0 && a.d.formato === 'multipla' && !a.tentativo) scegli(a.ordine[posto]);
    else if (e.key === 'Enter' && !e.target.matches?.('button, a')) {
      if (a.tentativo) prossima();
      else if (a.d.formato === 'multipla' && a.scelta != null) registra({ scelta: a.scelta });
      else return;
    } else return;
    e.preventDefault();
  }

  document.addEventListener('keydown', tasto);
  if (s.attuale) disegna();
  else prossima();
  return () => document.removeEventListener('keydown', tasto);
}

// ---------- ripasso: pagina di partenza ----------

export function vistaRipasso(radice) {
  const tentativi = archivio.tentativi();
  const scadute = inScadenza(tentativi).length;
  const piano = componiRipasso(tentativi);
  aggiungi(radice, 
    el('h1', {}, 'Ripasso errori'),
    el('p', {}, scadute
      ? `Oggi hai ${scadute} ${scadute === 1 ? 'domanda' : 'domande'} in scadenza.`
      : 'Oggi non hai domande in scadenza: il ripasso pesca dai tipi in cui vai peggio e da quelli che non hai mai provato.'),
    el('ul.regole', {},
      el('li', {}, `Questa sessione: ${piano.dallaCoda} ${piano.dallaCoda === 1 ? 'domanda già sbagliata' : 'domande già sbagliate'} e ${piano.daiTipiDeboli} ${piano.daiTipiDeboli === 1 ? 'nuova' : 'nuove'} dai tipi più deboli.`),
      el('li', {}, 'Una domanda sbagliata o lasciata in bianco torna dopo 1 giorno; se la indovini torna dopo 3 giorni, poi dopo 7. Alla terza risposta giusta esce dal ripasso.'),
      el('li', {}, 'Se la sbagli di nuovo, riparte da capo.')),
    el('div.azioni', {},
      el('button.btn.primario.grande', { type: 'button', disabled: !piano.domande.length, onclick: avviaRipasso }, 'Inizia il ripasso')));
}

// ---------- allenamento: scelta del filtro ----------

const filtro = { tipi: new Set(), soloAlta: false, formato: 'tutte', aperte: new Set() };

export function vistaFiltro(radice) {
  const tutti = tipiConDomande();
  const ammesso = t => (!filtro.soloAlta || t.frequenza === 'alta') && (filtro.formato === 'tutte' || t.formato === filtro.formato);
  const effettivi = () => tutti.filter(t => filtro.tipi.has(t.id) && ammesso(t));
  const aggiornamenti = []; // funzioni che riallineano caselle e conteggi alla selezione

  function cambia(tipi, attivo) {
    for (const t of tipi) {
      if (attivo) filtro.tipi.add(t.id);
      else filtro.tipi.delete(t.id);
    }
    aggiorna();
  }

  /** Casella che vale per un gruppo di tipi: piena, vuota o a metà. */
  function casellaGruppo(tipi, descrizione) {
    const casella = el('input', { type: 'checkbox', 'aria-label': descrizione, onchange: () => cambia(tipi, casella.checked) });
    aggiornamenti.push(() => {
      const scelti = tipi.filter(t => filtro.tipi.has(t.id)).length;
      casella.checked = scelti === tipi.length;
      casella.indeterminate = scelti > 0 && scelti < tipi.length;
    });
    return casella;
  }

  function bloccoLezione(lezione) {
    const tipi = tutti.filter(t => t.lezione === lezione.numero);
    if (!tipi.length) return null;
    const conta = el('span.conta');
    const corpo = el('div.corpo-lezione', { hidden: !filtro.aperte.has(lezione.numero) });
    const freccia = el('button.espandi', {
      type: 'button',
      'aria-expanded': String(filtro.aperte.has(lezione.numero)),
      onclick: () => {
        const aperta = corpo.hidden;
        corpo.hidden = !aperta;
        freccia.setAttribute('aria-expanded', String(aperta));
        if (aperta) filtro.aperte.add(lezione.numero);
        else filtro.aperte.delete(lezione.numero);
      },
    }, el('span.nome', {}, el('strong', {}, `${lezione.numero}. `), lezione.titolo), conta, el('span.freccia', { 'aria-hidden': 'true' }, '▾'));
    aggiornamenti.push(() => {
      const scelti = tipi.filter(t => filtro.tipi.has(t.id)).length;
      conta.textContent = scelti ? `${scelti} di ${tipi.length} tipi` : `${tipi.length} tipi`;
    });

    const argomenti = [...new Set(tipi.map(t => t.argomento))];
    for (const argomento of argomenti) {
      const delArgomento = tipi.filter(t => t.argomento === argomento);
      corpo.append(
        el('label.riga-argomento', {}, casellaGruppo(delArgomento, `Argomento ${argomento}`), el('span', {}, argomento)),
        el('ul.tipi', {}, delArgomento.map(t => el('li', {}, el('label.riga-scelta', {},
          casellaGruppo([t], t.titolo),
          el('span', {}, t.titolo,
            t.frequenza !== 'media' ? el('span.marca', {}, ETICHETTE_FREQUENZA[t.frequenza].toLowerCase()) : null,
            t.formato === 'aperta' ? el('span.marca', {}, 'aperta') : null))))));
    }
    return el('li.lezione', {},
      el('div.testa-lezione', {}, casellaGruppo(tipi, `Lezione ${lezione.numero}: ${lezione.titolo}`), freccia),
      corpo);
  }

  const riepilogo = el('span.riepilogo');
  const inizia = el('button.btn.primario', {
    type: 'button',
    onclick: () => {
      const tipi = effettivi();
      const lezioni = [...new Set(tipi.map(t => t.lezione))];
      const etichetta = tipi.length === 1 ? tipi[0].titolo
        : lezioni.length === 1 ? `Lezione ${lezioni[0]}: ${titoloLezione(lezioni[0])}` : `${tipi.length} tipi di ${lezioni.length} lezioni`;
      avviaAllenamento(tipi.map(t => t.id), etichetta);
    },
  }, 'Inizia');

  function aggiorna() {
    for (const f of aggiornamenti) f();
    const tipi = effettivi();
    const domande = tipi.reduce((n, t) => n + dati.perTipo.get(t.id).length, 0);
    riepilogo.textContent = tipi.length
      ? `${tipi.length} ${tipi.length === 1 ? 'tipo' : 'tipi'} · ${domande} domande`
      : filtro.tipi.size ? 'Nessun tipo scelto supera i filtri' : 'Scegli almeno una lezione';
    inizia.disabled = tipi.length === 0;
  }

  const formati = [['tutte', 'Tutte'], ['multipla', 'Solo a risposta multipla'], ['aperta', 'Solo aperte']];
  aggiungi(radice, 
    el('h1', {}, 'Allenamento mirato'),
    el('p.tenue', {}, 'Scegli lezioni intere, oppure aprile per scegliere argomenti e singoli tipi di domanda. I tipi si alternano e arrivano prima le domande che non hai mai visto.'),
    el('div.filtri', {},
      el('label.riga-scelta', {},
        el('input', { type: 'checkbox', checked: filtro.soloAlta, onchange: e => { filtro.soloAlta = e.target.checked; aggiorna(); } }),
        el('span', {}, 'Solo frequenza alta ', el('span.tenue', {}, '(i tipi già usciti nelle prove ufficiali)'))),
      el('label.riga-scelta', {},
        el('span', {}, 'Formato'),
        el('select', { onchange: e => { filtro.formato = e.target.value; aggiorna(); } },
          formati.map(([valore, nome]) => el('option', { value: valore, selected: filtro.formato === valore }, nome)))),
      el('div.azioni', {},
        el('button.btn.piccolo', { type: 'button', onclick: () => cambia(tutti, true) }, 'Seleziona tutto'),
        el('button.btn.piccolo', { type: 'button', onclick: () => cambia(tutti, false) }, 'Deseleziona tutto'))),
    el('ul.lezioni', {}, dati.lezioni.map(bloccoLezione)),
    el('div.barra-avvio', {}, riepilogo, inizia));
  aggiorna();
}
