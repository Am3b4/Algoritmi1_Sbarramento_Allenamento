# Algoritmi 1 · Allenamento allo sbarramento

Un sito per allenarsi al test di sbarramento di Algoritmi 1: simulazioni realistiche, allenamento per argomento, ripasso degli errori e statistiche per tipo di domanda.

> **Sito non ufficiale**, fatto da studenti. Non è collegato al corso né ai docenti.

Il sito: <https://am3b4.github.io/Algoritmi1_Sbarramento_Allenamento/>

- 1325 domande di 230 tipi, su 15 lezioni.
- Come il test vero: 15 domande in 15 minuti, +2 / −1 / 0, soglia 18 su 30, una domanda aperta (una funzione ricorsiva da scrivere).
- Nessun account: risposte e statistiche restano nel browser di chi lo usa. Si esportano e si importano con un file.
- Sito statico: HTML, CSS e JavaScript semplice, senza framework e senza server.

## Come si usa

| Modalità | A cosa serve |
| --- | --- |
| **Simulazione** | 14 domande a risposta multipla e una aperta, con il cronometro e la consegna automatica. Alla fine punteggio, esito e spiegazione di ogni domanda. La domanda aperta la valuti tu, confrontandola con la soluzione (0, 1 o 2 punti). |
| **Allenamento mirato** | Scegli lezioni, argomenti o singoli tipi. Una domanda alla volta, senza tempo, con la spiegazione subito. |
| **Ripasso errori** | Dieci domande: quelle sbagliate o lasciate in bianco, che tornano dopo 1, 3 e 7 giorni, più domande nuove dei tipi in cui vai peggio. |
| **Statistiche** | Andamento delle simulazioni, accuratezza per lezione, argomento e tipo, e gli errori tipici in cui cadi più spesso. |

Da tastiera: `1`–`4` (o `a`–`d`) per scegliere, `Invio` per confermare o passare alla domanda successiva, `←` `→` per spostarsi nella simulazione.

## Provarlo sul proprio computer

Servono Python 3 e, per le prove, Node 22 o successivo.

```bash
python strumenti/costruisci_sito.py
```

```bash
python -m http.server 8765 --directory sito
```

Poi si apre `http://localhost:8765`. Il sito non funziona aprendo `index.html` con un doppio clic: il browser non lascia leggere i file delle domande.

## Com'è fatto

```
dati/                 catalogo dei tipi di domanda, uno per lezione (+ schema.json, indice.json)
domande/              le domande, un file per lezione: L01.json … L15.json
sito/                 quello che va online
  index.html
  css/stile.css
  js/app.js           avvio e passaggio tra le schermate
  js/archivio.js      registro dei tentativi nel browser, esporta e importa
  js/selezione.js     come si scelgono le domande nelle tre modalità
  js/statistiche.js   i conti delle statistiche
  js/alberi.js        lettura e disegno degli alberi
  js/contenuti.js     testo, codice, array a celle, opzioni
  js/viste/           una schermata per file
  dati/               generata da costruisci_sito.py, non va modificata a mano
strumenti/
  costruisci_sito.py  prepara sito/dati/ a partire da dati/ e domande/
  valida_formato.py   controlla il formato delle domande
  esempi.py           tiene fuori da git il campo `esempio` dei tipi (vedi sotto)
  prova_logica.mjs    prove della scelta delle domande, del ripasso e delle statistiche
revisione/            report della revisione delle domande
```

`dati/` e `domande/` sono l'unica copia da modificare. `sito/dati/` si rigenera con `costruisci_sito.py`: contiene le domande e, del catalogo, solo i campi che il sito usa (titolo, argomento, frequenza, formato, difficoltà e trappole).

### Dati salvati nel browser

| Chiave del localStorage | Contenuto |
| --- | --- |
| `algo1.tentativi` | `{versione, elenco}`: una voce per ogni risposta data |
| `algo1.simulazioni` | `{versione, elenco}`: il riepilogo di ogni simulazione |
| `algo1.impostazioni` | tema e durata della simulazione |
| `algo1.sessione` | la simulazione in corso, per riprenderla se la pagina si chiude |

Una voce del registro:

```json
{"domanda": "L09-T08-03", "tipo": "L09-T08", "esito": "sbagliata", "errore": "E1", "scelta": 0,
 "secondi": 41, "modalita": "simulazione", "sessione": "2026-11-04T18:02:00", "quando": "2026-11-04T18:05:12Z"}
```

`esito` vale `giusta`, `sbagliata`, `bianca` oppure, per le aperte, `aperta-0`, `aperta-1`, `aperta-2`. La coda del ripasso non si salva: si ricalcola dal registro, così resta giusta anche dopo un'importazione.

## Pubblicarlo su GitHub Pages

1. Creare il repository e caricare questa cartella sul ramo `main`.
2. In **Settings → Pages**, alla voce **Source**, scegliere **GitHub Actions**.
3. A ogni modifica il controllo automatico (`.github/workflows/pubblica.yml`) valida le domande, prova la logica, genera `sito/dati/` e pubblica `sito/`.

Il pulsante «Segnala un errore» apre una issue già compilata con l'id della domanda. L'indirizzo del repository è scritto in `sito/js/config.js`, alla voce `repo`: chi copia il progetto in un altro repository deve cambiarlo.

### Cosa non va online

Dispense, prove ufficiali e testi estratti sono materiale dei docenti: stanno nella cartella `fonti/`, esclusa dal `.gitignore`.

Lo stesso vale per il campo `esempio` dei tipi di domanda, perché alcuni esempi riprendono quasi alla lettera le prove ufficiali. Nel repository i file di `dati/` non lo contengono: gli esempi stanno in `fonti/esempi/`, solo sul computer di chi genera le domande.

```bash
python strumenti/esempi.py rimetti
```

li riporta in `dati/` per lavorare alla generazione di nuove varianti, e

```bash
python strumenti/esempi.py togli
```

li toglie di nuovo prima di un commit. Il controllo automatico rifiuta una modifica che li contiene.

## Contribuire

- **Hai trovato un errore in una domanda?** Usa «Segnala un errore» sotto la spiegazione, oppure apri una issue con l'id della domanda.
- **Vuoi correggere o aggiungere domande?** Modifica `domande/LNN.json` e proponi la modifica con una pull request. Non serve toccare il codice.

Una domanda a risposta multipla:

```json
{
  "id": "L09-T08-03",
  "tipo": "L09-T08",
  "formato": "multipla",
  "difficolta": 2,
  "testo": "Dal min-heap A = [3, 5, 4, 9, 6, 8, 7, 10] si estrae il minimo (heappop). Che array si ottiene?",
  "codice": null,
  "albero": null,
  "opzioni": ["[4, 5, 10, 9, 6, 8, 7]", "[4, 5, 6, 7, 8, 9, 10]", "[4, 5, 8, 9, 6, 10, 7]", "[4, 5, 7, 9, 6, 8, 10]"],
  "corretta": 3,
  "errori": ["E1", "E3", "E2", null],
  "spiegazione": "Il 10 va in radice e scende verso il figlio minore: prima 4, poi 7."
}
```

- `id` è l'id del tipo più un numero progressivo. Non va mai cambiato: il registro dei tentativi lo usa.
- `corretta` è l'indice dell'opzione giusta, da 0 a 3. Il sito mescola le opzioni a ogni presentazione.
- `errori` dice, per ogni opzione sbagliata, quale trappola del tipo la produce: `E1` è la prima voce di `trappole` nel catalogo, `E2` la seconda; `altro` se non corrisponde a nessuna; `null` per l'opzione giusta.
- `albero` usa la notazione `8(4(2, -), 10)`: il sito lo disegna. Disegna anche gli alberi scritti così nel testo e nelle opzioni, e mostra a celle gli array come `[3, 5, 4]`.
- Le domande aperte hanno `soluzione` e `controlli` al posto di `opzioni`, `corretta` ed `errori`.

Le regole complete sono in `ISTRUZIONI_VARIANTI.md`. Prima di proporre una modifica:

```bash
python strumenti/valida_formato.py
```

```bash
node strumenti/prova_logica.mjs
```

## Licenze

Codice con licenza MIT. Domande e catalogo dei tipi con licenza CC BY-SA 4.0. I dettagli sono nel file `LICENSE`.
