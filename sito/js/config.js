// Costanti del sito: le regole del test e i parametri della scelta delle domande.

export const CONFIG = {
  nome: 'Algoritmi 1 · Allenamento',
  // Repository GitHub nella forma "utente/repository", per il pulsante "Segnala un errore".
  // Se è vuoto e il sito gira su GitHub Pages, si ricava dall'indirizzo della pagina.
  repo: 'Am3b4/Algoritmi1_Sbarramento_Allenamento',

  soglia: 18,              // punteggio minimo per superare lo sbarramento
  massimo: 30,
  minutiSimulazione: 15,   // durata predefinita; si cambia nelle impostazioni
  multipleSimulazione: 14, // domande a risposta multipla, più una aperta

  // Peso con cui un tipo viene estratto, in base alla frequenza nelle prove ufficiali.
  pesi: { alta: 3, media: 1.5, bassa: 0.5 },
  maxPerLezione: 2,        // al massimo due domande della stessa lezione in una simulazione
  minLezioni: 10,          // almeno dieci lezioni diverse in una simulazione

  ripasso: {
    domande: 10,           // lunghezza di una sessione di ripasso
    inScadenza: 6,         // quante vengono dalla coda delle domande sbagliate
    intervalli: [1, 3, 7], // giorni di attesa per le tre caselle
    ultimi: 10,            // tentativi recenti che contano per l'accuratezza di un tipo
    maxAperte: 1,          // domande aperte nuove per sessione
  },
};

export const ETICHETTE_FREQUENZA = { alta: 'Frequenza alta', media: 'Frequenza media', bassa: 'Frequenza bassa' };

/** "utente/repository" su GitHub, oppure null se non si può sapere. */
export function repoGithub() {
  if (CONFIG.repo) return CONFIG.repo;
  const m = /^([\w-]+)\.github\.io$/.exec(location.hostname);
  const cartella = location.pathname.split('/').filter(Boolean)[0];
  return m && cartella && !cartella.includes('.') ? `${m[1]}/${cartella}` : null;
}

/** Indirizzo di una nuova issue già compilata con l'id della domanda. */
export function linkSegnalazione(domanda) {
  const repo = repoGithub();
  if (!repo) return null;
  const titolo = `Errore nella domanda ${domanda.id}`;
  const corpo = `Domanda: ${domanda.id}\nTipo: ${domanda.tipo}\n\nCosa c'è di sbagliato:\n`;
  return `https://github.com/${repo}/issues/new?title=${encodeURIComponent(titolo)}&body=${encodeURIComponent(corpo)}`;
}
