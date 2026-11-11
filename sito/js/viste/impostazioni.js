// Impostazioni: esporta e importa i dati, azzera le statistiche, tema, durata della simulazione.

import { repoGithub } from '../config.js';
import { dati } from '../dati.js';
import * as archivio from '../archivio.js';
import { el, aggiungi, avviso, conferma, giornoLocale, ridisegna } from '../util.js';
import { applicaTema } from '../tema.js';

function scarica(nome, contenuto) {
  const indirizzo = URL.createObjectURL(new Blob([contenuto], { type: 'application/json' }));
  const link = el('a', { href: indirizzo, download: nome });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(indirizzo), 1000);
}

export function vistaImpostazioni(radice) {
  const imp = archivio.impostazioni();
  const nTentativi = archivio.tentativi().length;
  const nSimulazioni = archivio.simulazioni().length;

  const scegliFile = el('input', {
    type: 'file', accept: 'application/json,.json', hidden: true,
    onchange: async e => {
      const [file] = e.target.files;
      e.target.value = '';
      if (!file) return;
      try {
        const esito = archivio.importa(JSON.parse(await file.text()));
        avviso(`Importate ${esito.tentativi} risposte e ${esito.simulazioni} simulazioni nuove.`);
        ridisegna();
      } catch (errore) {
        avviso(errore instanceof SyntaxError ? 'Il file non è un JSON valido.' : errore.message);
      }
    },
  });

  const temi = [['auto', 'Come il dispositivo'], ['chiaro', 'Chiaro'], ['scuro', 'Scuro']];
  const repo = repoGithub();

  aggiungi(radice, 
    el('h1', {}, 'Impostazioni'),

    el('section', {},
      el('h2', {}, 'I tuoi dati'),
      el('p', {}, `In questo browser ci sono ${nTentativi} risposte e ${nSimulazioni} simulazioni. Restano solo qui: per passare da un dispositivo all'altro, esporta un file e importalo sull'altro. L'importazione aggiunge ai dati presenti, senza doppioni.`),
      el('div.azioni', {},
        el('button.btn', { type: 'button', onclick: () => scarica(`algo1-dati-${giornoLocale()}.json`, JSON.stringify(archivio.esporta())) }, 'Esporta i dati'),
        el('button.btn', { type: 'button', onclick: () => scegliFile.click() }, 'Importa i dati'),
        scegliFile),
      el('div.azioni', {},
        el('button.btn.pericolo', {
          type: 'button',
          disabled: !nTentativi && !nSimulazioni,
          onclick: async () => {
            const si = await conferma({
              titolo: 'Azzerare le statistiche?',
              testo: `Verranno cancellate ${nTentativi} risposte e ${nSimulazioni} simulazioni da questo browser. Non si può annullare: se vuoi tenerne una copia, esporta prima i dati.`,
              ok: 'Azzera', pericolo: true,
            });
            if (!si) return;
            archivio.azzera();
            avviso('Statistiche azzerate.');
            ridisegna();
          },
        }, 'Azzera le statistiche'))),

    el('section', {},
      el('h2', {}, 'Simulazione'),
      el('label.campo', {},
        el('span', {}, 'Durata in minuti ', el('span.tenue', {}, '(nel test vero sono 15)')),
        el('input', {
          type: 'number', min: 5, max: 60, step: 1, value: imp.minuti, inputmode: 'numeric',
          onchange: e => {
            const minuti = Math.min(60, Math.max(5, Math.round(Number(e.target.value)) || 15));
            e.target.value = minuti;
            archivio.salvaImpostazioni({ minuti });
          },
        }))),

    el('section', {},
      el('h2', {}, 'Aspetto'),
      el('div.schede', { role: 'radiogroup', 'aria-label': 'Tema' }, temi.map(([valore, nome]) => el('button', {
        type: 'button', role: 'radio', 'aria-checked': String(imp.tema === valore),
        onclick: e => {
          archivio.salvaImpostazioni({ tema: valore });
          applicaTema();
          for (const b of e.currentTarget.parentNode.children) b.setAttribute('aria-checked', String(b === e.currentTarget));
        },
      }, nome)))),

    el('section', {},
      el('h2', {}, 'Informazioni'),
      el('p', {}, `${dati.domande.size} domande di ${dati.tipi.size} tipi, su ${dati.lezioni.length} lezioni. Sito non ufficiale, fatto da studenti: non è collegato al corso né ai docenti.`),
      el('p', {}, 'Hai trovato una domanda sbagliata? Usa «Segnala un errore» sotto la sua spiegazione.',
        repo ? [' Il codice e le domande sono su ', el('a', { href: `https://github.com/${repo}`, target: '_blank', rel: 'noopener' }, 'GitHub'), '.'] : null)));
}
