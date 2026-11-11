# Sito di allenamento Algoritmi 1 — specifica

Nov 3, 2026 · @Maksym

Un sito statico per allenarsi al test di sbarramento di Algoritmi 1, con simulazioni realistiche e statistiche sugli errori per tipo di domanda, pubblicato su GitHub perché lo usino anche altri studenti.

## Obiettivo e principi

Il sito deve far arrivare uno studente sopra 18/30 allo sbarramento, allenandolo sui tipi di domanda che sbaglia di più. Per poterlo pubblicare gratis su GitHub e farlo usare a chiunque, è un sito **statico**: solo file HTML, CSS, JavaScript e JSON, senza server.

- **Pubblicazione**: GitHub Pages, con indirizzo del tipo `nomeutente.github.io/algoritmi1`. Chi vuole lo usa aprendo il link, senza installare nulla.
- **Nessun account**: le risposte e le statistiche restano nel browser di chi lo usa (localStorage). Nessuno vede i dati degli altri e non serve gestire password o privacy.
- **Dati portabili**: un pulsante esporta tutto in un file JSON e uno lo reimporta, per passare dal telefono al computer o non perdere lo storico.
- **Contenuti separati dal codice**: le domande stanno in file JSON. Aggiungere domande o correggerne una non richiede di toccare il codice.
- **Fedele al test vero**: 15 domande, 15 minuti, +2 / −1 / 0, soglia 18, possibilità di lasciare in bianco, una domanda aperta (sempre una funzione ricorsiva da scrivere).
- **Prima il telefono**: deve funzionare bene a 400 px di larghezza, perché è lì che si ripassa nei tempi morti.
- **Niente framework** all'inizio: JavaScript semplice, così chiunque può leggerlo e contribuire. Se il codice cresce troppo, si valuta dopo.

## Le quattro modalità

La pagina iniziale mostra il punteggio medio delle ultime simulazioni e i tre tipi di domanda più sbagliati, poi quattro pulsanti.

| Modalità | A cosa serve | Come funziona | Correzione |
| --- | --- | --- | --- |
| **Simulazione** | Capire se oggi passeresti | 15 domande come nel test vero (14 a risposta multipla e 1 aperta), cronometro di 15 minuti con consegna automatica, possibilità di lasciare in bianco | Alla consegna: punteggio con +2 / −1 / 0, esito rispetto a 18, spiegazione di ogni domanda |
| **Allenamento mirato** | Studiare un argomento | Scegli una o più lezioni, argomenti o tipi; domande una alla volta, senza tempo | Subito dopo ogni risposta, con spiegazione |
| **Ripasso errori** | Rinforzare i punti deboli | Il sito sceglie le domande dai tipi in cui sbagli di più e ripropone quelle sbagliate dopo qualche giorno | Subito dopo ogni risposta |
| **Statistiche** | Vedere dove migliorare | Grafici e tabelle per tipo, argomento e lezione; andamento delle simulazioni nel tempo | — |

**La domanda aperta** non si corregge in automatico. Dopo la consegna il sito mostra la tua risposta accanto alla soluzione di riferimento e a una breve lista di controllo (per esempio "c'è il caso base su None?"). Sei tu a scegliere 0, 1 o 2 punti, e il punteggio finale si aggiorna.

## Formato dei dati

I dati sono di tre tipi: il **catalogo dei tipi**, che esiste già; le **domande**, cioè le varianti da generare; e il **registro dei tentativi**, che il sito scrive nel browser. Ogni domanda punta al suo tipo, e ogni tentativo punta alla sua domanda: è così che le statistiche si possono raggruppare per tipo, argomento e lezione.

**1. Catalogo dei tipi (già pronto).** `dati/tipi_LNN_*.json`, uno per lezione, più `schema.json` e `indice.json`. Sono 230 tipi. Il sito usa di ogni tipo solo `id`, `titolo`, `argomento`, `frequenza`, `formato` e `difficolta`; gli altri campi servono a chi genera le domande.

**2. Domande.** `domande/LNN.json`, un file per lezione, ognuno con una lista di domande in questa forma:

```json
{
  "id": "L09-T08-03",
  "tipo": "L09-T08",
  "formato": "multipla",
  "testo": "Dal min-heap A = [3, 5, 4, 9, 6, 8, 7, 10] si estrae il minimo (heappop). Che array si ottiene?",
  "codice": null,
  "albero": null,
  "opzioni": ["[4, 5, 10, 9, 6, 8, 7]", "[4, 5, 6, 7, 8, 9, 10]", "[4, 5, 8, 9, 6, 10, 7]", "[4, 5, 7, 9, 6, 8, 10]"],
  "corretta": 3,
  "errori": ["E1", "E3", "E2", null],
  "spiegazione": "Il 10 va in radice e scende verso il figlio minore: prima 4, poi 7."
}
```

- `id` = id del tipo + numero progressivo della variante. Non cambia mai, perché il registro dei tentativi lo usa.
- `codice` contiene un frammento di codice da mostrare in un riquadro a parte (o `null`); `albero` un albero nella notazione `8(4(2, -), 10)`, che il sito disegna (o `null`).
- `corretta` è l'indice dell'opzione giusta (da 0 a 3). Il sito **mescola le opzioni** a ogni presentazione, così non si memorizza la lettera.
- `errori` dice, per ogni opzione sbagliata, il codice della trappola che la produce: E1 è la prima voce della lista `trappole` del tipo, E2 la seconda, e così via; `null` per l'opzione giusta. Serve per la vista "Come sbaglio" delle statistiche. Le istruzioni complete per generare le domande sono in `ISTRUZIONI_VARIANTI.md`.
- Le domande aperte hanno `soluzione` (pseudocodice) e `controlli` (lista di cose da verificare) al posto di `opzioni` e `corretta`.

**3. Registro dei tentativi** (nel browser, chiave `algo1.tentativi`). Un elemento per ogni risposta data:

```json
{"domanda": "L09-T08-03", "tipo": "L09-T08", "esito": "sbagliata", "errore": "E1", "secondi": 41, "modalita": "simulazione", "sessione": "2026-11-04T18:02", "quando": "2026-11-04T18:05:12Z"}
```

`esito` vale `giusta`, `sbagliata`, `bianca` oppure, per le aperte, `aperta-0`, `aperta-1`, `aperta-2`. A parte si salva il riepilogo di ogni simulazione (punteggio, tempo, esito), per il grafico dell'andamento. Si prevede un campo `versione` per poter cambiare il formato in futuro senza perdere i dati vecchi.

## Come vengono scelte le domande

La simulazione deve somigliare al test vero, perché il punteggio sia una stima onesta. Il ripasso invece deve insistere sui punti deboli. Per questo le due modalità usano regole diverse.

**Simulazione**

1. Si scelgono 14 tipi a risposta multipla, estratti a caso con un peso: frequenza alta × 3, media × 1,5, bassa × 0,5. Così i tipi già usciti nelle prove ufficiali compaiono più spesso, senza escludere gli altri.
2. Vincoli di copertura, come nelle prove ufficiali: al massimo 2 domande della stessa lezione, almeno 10 lezioni diverse, mai due volte lo stesso tipo.
3. Si aggiunge una domanda aperta, scelta con lo stesso peso tra i tipi aperti. Nel test vero è sempre una funzione ricorsiva da scrivere, quindi i tipi aperti esistono solo nelle lezioni 3 (ricorsione su un intero), 10 (liste concatenate), 12, 14 e 15 (alberi): 19 tipi in tutto.
4. Per ogni tipo si prende una variante non ancora vista; se le hai viste tutte, quella vista meno di recente.
5. Le domande si mostrano nell'ordine del programma, dalla lezione 1 alla 15, come nei test veri, con la domanda aperta nella posizione della sua lezione.

La simulazione **non** si adatta ai tuoi errori, altrimenti il punteggio sarebbe più basso di quello reale e non direbbe se sei pronto.

**Allenamento mirato**

- Scegli un filtro: lezioni, argomenti, singoli tipi, oppure "solo frequenza alta".
- Le domande si alternano tra i tipi del filtro, così non ne fai dieci dello stesso tipo di fila. Vengono prima le varianti mai viste.

**Ripasso errori**

Una sessione di ripasso ha 10 domande, prese da due fonti:

1. **Domande in scadenza (circa 6 su 10).** Ogni domanda sbagliata o lasciata in bianco entra in una coda con tre caselle. Torna dopo 1 giorno; se la indovini passa alla casella successiva e torna dopo 3 giorni, poi dopo 7. Se la sbagli torna alla prima casella. Dopo la terza risposta giusta esce dalla coda.
2. **Tipi deboli (le restanti).** Varianti nuove dei tipi con la priorità più alta. La priorità è (1 − accuratezza recente) × peso della frequenza. L'accuratezza recente conta solo gli ultimi 10 tentativi di quel tipo, perché deve misurare come vai adesso e non come andavi un mese fa. Un tipo mai provato riceve una priorità media, così prima o poi esce.

Le risposte lasciate in bianco in simulazione non tolgono punti, ma per il ripasso contano come errori: se non sapevi rispondere, quel tipo va ripassato.

## Statistiche

La pagina delle statistiche risponde a tre domande, nell'ordine: sto migliorando? dove sbaglio? come sbaglio?

**1. Andamento.** Un grafico a linee dei punteggi delle simulazioni nel tempo, con una linea orizzontale a 18 e la media delle ultime cinque. Accanto, tre numeri: ultimo punteggio, media delle ultime cinque, percentuale di simulazioni superate.

**2. Dove sbaglio.** Tre livelli, dal generale al dettaglio:

| Vista | Cosa mostra | Ordinamento |
| --- | --- | --- |
| Per lezione | Accuratezza e numero di risposte per ciascuna delle 15 lezioni | Numero di lezione |
| Per argomento | Accuratezza per argomento (per esempio "Tracce di heap", "Teorema principale") | Dalla peggiore |
| Per tipo | Accuratezza recente (ultimi 10 tentativi), tentativi totali, data dell'ultimo, frequenza del tipo | Per priorità di ripasso |

Ogni riga si apre e mostra le ultime domande di quel tipo, con la tua risposta e la spiegazione. Un pulsante "Allenati su questo" avvia l'allenamento mirato con quel filtro.

**3. Come sbaglio.** Ogni opzione sbagliata porta già, nel file delle domande, il codice della trappola che la produce (campo `errori`). Quando sbagli, il registro salva quel codice; il sito poi conta i codici per tipo e mostra il testo della trappola preso dal catalogo. Tutto il ragionamento è fatto quando si generano le domande: nel browser resta solo un conteggio, quindi un sito statico basta. Esempio: "Nelle tracce di heappop, 4 errori su 6 sono 'ti fermi dopo il primo scambio'". Questa vista è la più utile per correggere un'abitudine, non solo un argomento.

**Altri numeri utili.** Il tempo medio per domanda (in simulazione deve stare sotto i 60 secondi); la percentuale di risposte in bianco; il **saldo delle risposte date a caso**, cioè quanti punti hai guadagnato o perso rispondendo con poca sicurezza. Per misurare quest'ultimo, in simulazione si può segnare una domanda come "non sono sicuro".

## Interfaccia

Cinque schermate, tutte in una colonna sola, così funzionano allo stesso modo su telefono e computer.

| Schermata | Contenuto |
| --- | --- |
| Home | Ultimo punteggio e media, i 3 tipi più deboli, i quattro pulsanti delle modalità, il numero di domande di ripasso in scadenza oggi |
| Domanda | Testo, eventuale riquadro di codice o albero disegnato, 4 opzioni grandi da toccare, "Lascia in bianco", "Non sono sicuro"; in simulazione una barra in alto con tempo, numero di domanda e pulsante Consegna |
| Correzione | Punteggio ed esito, poi l'elenco delle domande con la tua risposta, quella giusta e la spiegazione; per la domanda aperta, il confronto con la soluzione e i pulsanti 0/1/2 punti |
| Statistiche | Le tre sezioni descritte sopra |
| Impostazioni | Esporta e importa i dati, azzera le statistiche, tema chiaro o scuro, durata della simulazione |

**Rendering dei contenuti**

- **Formule**: caratteri Unicode (Θ, Ω, ≤, n², log₂ n), come nei file dei tipi. Niente librerie di formule: pagine più leggere e veloci.
- **Codice**: riquadro a larghezza fissa che scorre in orizzontale se è troppo largo, senza far scorrere tutta la pagina.
- **Alberi**: il sito legge la notazione `8(4(2, -), 10)` e disegna l'albero in SVG, con i figli mancanti lasciati vuoti. Serve per heap, ABR, AVL e visite: leggere un albero scritto in una riga è un ostacolo in più che il test vero non ha.
- **Array e tabelle hash**: celle numerate con l'indice sopra, così le posizioni si leggono subito.

**Navigazione nella simulazione**: si può saltare avanti e indietro tra le domande, come sul foglio d'esame, e una griglia di 15 caselle mostra quali hai già risposto, lasciato in bianco o segnato come incerte.

**Accessibilità**: si può usare con la tastiera (tasti 1–4 per le opzioni, Invio per confermare); colori di giusto e sbagliato sempre accompagnati da un'icona o da una scritta, non solo dal colore.

## Generazione e controllo delle varianti

Le domande sbagliate fanno più danni di quelle che mancano: uno studente che impara una risposta errata la ripete all'esame. Per questo ogni domanda passa tre controlli prima di arrivare sul sito.

**Quante varianti per tipo**

| Frequenza del tipo | Tipi | Varianti per tipo | Domande |
| --- | --- | --- | --- |
| Alta | 31 | 8 | circa 240 |
| Media | 179 | 6 | circa 1025 |
| Bassa | 20 | 3 | circa 60 |
| Totale | 230 | — | circa 1325 |

Con circa 1325 domande si possono fare decine di simulazioni senza ripetizioni. Se ne aggiungono altre solo per i tipi in cui le statistiche mostrano che servono.

**Procedura, una lezione alla volta**

1. **Generazione** con il modello più economico. Gli si danno `ISTRUZIONI_VARIANTI.md`, `schema.json` e il file dei tipi della lezione, chiedendo N varianti per tipo nel formato delle domande (sezione "Formato dei dati"). Il modello segue `come_generare_varianti`, costruisce le opzioni sbagliate dalle `trappole` del tipo e scrive in `errori` il codice della trappola usata per ciascuna.
2. **Controllo automatico** con uno script Python (`strumenti/valida.py`):
   - formato: campi presenti, id unici e coerenti con il tipo, 4 opzioni tutte diverse, `corretta` tra 0 e 3, alberi scritti in notazione leggibile;
   - **ricalcolo delle risposte** per i tipi che si possono calcolare. Lo script contiene le funzioni della dispensa (heappush, heappop, heapify, inserimento e scansione hash, inserimento e cancellazione ABR, AVL, visite, ricerca binaria, Partiziona, passate dei sort) e verifica che la risposta segnata coincida con quella calcolata e che nessun distrattore sia anch'esso corretto.
3. **Revisione a campione** con un modello più forte: tutte le domande dei tipi non calcolabili (costi, definizioni, ricorrenze) e il 10% delle altre. Le domande dubbie vengono corrette o scartate.

**Dopo la pubblicazione**: ogni domanda ha un pulsante "Segnala un errore" che apre una issue su GitHub già compilata con l'id della domanda. Così chi usa il sito aiuta a correggerlo.

## Repository e pubblicazione

Un solo repository pubblico, pubblicato con GitHub Pages direttamente dalla cartella `sito/`. Gli strumenti per generare e controllare le domande stanno nello stesso repository, ma non finiscono online.

```
algoritmi1-allenamento/
├── sito/                  pubblicato su GitHub Pages
│   ├── index.html
│   ├── css/stile.css
│   ├── js/                 app.js, selezione.js, statistiche.js, alberi.js, archivio.js
│   └── dati/
│       ├── tipi/           i 15 file dei tipi, schema.json, indice.json
│       └── domande/        L01.json … L15.json
├── strumenti/              valida.py, riferimenti.py (funzioni della dispensa), prompt di generazione
├── .github/workflows/      controllo automatico a ogni modifica
├── README.md               cos'è, come si usa, come contribuire
└── LICENSE
```

- **Controllo automatico**: a ogni modifica, o a ogni proposta di modifica di un altro studente (pull request), GitHub esegue `valida.py`. Se una domanda non passa i controlli, la modifica viene segnalata prima di andare online.
- **Contributi**: chi trova un errore apre una issue (anche dal pulsante "Segnala un errore"); chi vuole aggiungere domande propone una modifica ai file JSON. Il README spiega il formato con un esempio.
- **Licenze**: codice con licenza MIT; domande con licenza CC BY-SA 4.0, così chiunque può riusarle citando la fonte e condividendo allo stesso modo le modifiche.

**Cosa non pubblicare.** Le dispense e le prove d'esame sono materiale dei docenti, non nostro.

- Fuori dal repository: i PDF delle dispense, i testi estratti (la cartella `fonti/`), le prove ufficiali con soluzioni. Si aggiunge `fonti/` al `.gitignore`.
- Nei file dei tipi, il campo `fonte` cita il titolo del lucido o il numero della domanda: va bene. Alcuni `esempio` riprendono invece quasi alla lettera domande delle prove ufficiali: prima di pubblicare vanno riformulati, oppure si chiede il permesso ai docenti.
- Il README e la pagina iniziale dicono chiaramente che il sito **non è ufficiale** e non è collegato al corso. È comunque buona norma scrivere ai docenti prima di diffonderlo: potrebbero anche segnalarlo agli studenti.

## Fasi di lavoro

L'ordine serve ad avere presto qualcosa di usabile per studiare, e a scoprire i problemi del formato su poche domande prima di generarne 1325.

1. **Prova del formato.** Si generano le varianti di tre lezioni con molte domande d'esame (12 alberi, 14 ABR, 9 heap), si scrive `valida.py` con le funzioni di riferimento di queste lezioni e si corregge il formato se qualcosa non torna.
2. **Prima versione del sito.** Simulazione e allenamento mirato, registro dei tentativi nel browser, esporta e importa. Funziona già con le tre lezioni della fase 1, e lo usi tu per studiare.
3. **Tutte le domande.** Generazione e controllo delle altre 12 lezioni, completamento di `valida.py`, revisione a campione.
4. **Statistiche e ripasso.** Le tre viste delle statistiche, il ripasso con la coda a caselle, il disegno degli alberi in SVG.
5. **Pubblicazione.** README, licenze, controllo automatico su GitHub, pulizia dei contenuti presi dalle prove ufficiali, pubblicazione su GitHub Pages e messaggio ai docenti.
6. **Miglioramenti dopo l'uso.** Nuove varianti dove le statistiche mostrano che servono e correzioni dalle segnalazioni. In seguito, se utile, una sezione per gli esercizi dello scritto.

Le fasi 1–2 conviene farle con Claude Code, che lavora direttamente sulla cartella del progetto ed esegue gli script.

## Decisioni aperte

- [ ] **Nome** del sito e del repository (per esempio `algoritmi1-allenamen``t``o`).
- [ ] **Account GitHub**: personale o un'organizzazione creata apposta, se altri studenti dovranno poter approvare le modifiche.
- [ ] **Docenti**: scrivere prima della pubblicazione per avvisarli e chiedere se va bene usare domande simili alle prove ufficiali.
- [ ] **Quante varianti** generare: i numeri della tabella (circa 1325 domande) sono una proposta e dipendono da quanto costa la generazione.
- [ ] **Data della prossima sessione**, per decidere quali fasi devono essere pronte prima.
- [ ] **Esercizi dello scritto**: se in futuro aggiungere una sezione per gli esercizi lunghi (progetta l'algoritmo, calcola il costo), che hanno bisogno di una correzione diversa.\


\
Algo1\_Allenamento\_Sbarramento\
Personale\
Chiesto\
Va bene quello proposto(Gia fatto)\
Gennaio\
In futuro
