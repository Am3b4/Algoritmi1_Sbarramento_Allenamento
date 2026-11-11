# Prompt per Claude Code: generazione e revisione delle domande (L03–L15)

Copia tutto il testo sotto la riga e incollalo in Claude Code, aperto nella cartella del progetto (quella che contiene `dati/`, `domande/`, `strumenti/` e i file `ISTRUZIONI_*.md`). Usa Opus come modello della sessione principale: coordina e revisiona, mentre la generazione la fanno i sottoagenti.

---

Sei il coordinatore della generazione delle domande per un sito di allenamento al test di sbarramento di Algoritmi 1 (Sapienza). Lavori nella cartella corrente. Non scrivi tu le domande: lanci sottoagenti con lo strumento Agent, controlli il loro lavoro, poi lanci la revisione.

## Contesto da leggere prima di iniziare

- `ISTRUZIONI_VARIANTI.md`: le regole che seguono i generatori. Leggilo tutto, ti serve per valutare i risultati.
- `dati/schema.json` (convenzioni comuni) e `dati/indice.json` (lezioni e numero di tipi).
- `domande/L01.json` e `domande/L02.json` sono già stati generati e revisionati: **non toccarli**. Servono come esempio del risultato atteso.
- `strumenti/valida_formato.py`: controlla il formato di un file di domande. Uso: `python3 strumenti/valida_formato.py 9` per la lezione 9, senza argomenti per tutte.

## Regole generali

- Ogni sottoagente lavora su **una sola lezione** e scrive **un solo file**: `domande/LNN.json` (generazione) oppure modifica quel file e scrive `revisione/LNN.md` (revisione). Due agenti non devono mai scrivere lo stesso file.
- I generatori non modificano i file in `dati/`. I revisori possono solo **aggiungere in fondo** alla lista `trappole` di un tipo una trappola che manca davvero (mai riordinare, cancellare o riformulare quelle esistenti, perché i codici E1, E2… delle domande dipendono dalla posizione). Ogni aggiunta va scritta nel report di revisione.
- Lancia gli agenti in **gruppi di al più 4 in parallelo**: aspetta che un gruppo finisca prima di lanciare il successivo, così non si superano i limiti di uso.
- Se un agente si interrompe (errore, limite raggiunto), rilancialo sulla stessa lezione partendo dal file che ha già scritto, se c'è.

## Fase 1: generazione

Lancia un sottoagente per ogni lezione da 3 a 15, con modello e impegno di questa tabella:

| Lezione | File dei tipi | Modello | Impegno |
| --- | --- | --- | --- |
| 3 | `dati/tipi_L03_*.json` | sonnet | high |
| 4 | `dati/tipi_L04_*.json` | sonnet | xhigh |
| 5 | `dati/tipi_L05_*.json` | sonnet | xhigh |
| 6 | `dati/tipi_L06_*.json` | haiku | medium |
| 7 | `dati/tipi_L07_*.json` | haiku | medium |
| 8 | `dati/tipi_L08_*.json` | haiku | medium |
| 9 | `dati/tipi_L09_*.json` | haiku | medium |
| 10 | `dati/tipi_L10_*.json` | sonnet | high |
| 11 | `dati/tipi_L11_*.json` | haiku | medium |
| 12 | `dati/tipi_L12_*.json` | sonnet | high |
| 13 | `dati/tipi_L13_*.json` | haiku | medium |
| 14 | `dati/tipi_L14_*.json` | sonnet | high |
| 15 | `dati/tipi_L15_*.json` | sonnet | high |

Gruppi consigliati: (9, 12, 14, 4), (3, 5, 10, 15), (6, 7, 8, 13), (11).

Prompt per ogni generatore (sostituisci NN e N):

> Genera le domande della lezione N per un sito di allenamento al test di sbarramento di Algoritmi 1.
> 1. Leggi per intero `ISTRUZIONI_VARIANTI.md`, `dati/schema.json` e il catalogo `dati/tipi_LNN_*.json` (anche il campo `lezione.nota`, se c'è). Segui le istruzioni alla lettera.
> 2. Scrivi `domande/LNN.json` con il numero di varianti per tipo indicato nella tabella delle istruzioni. Lavora un tipo alla volta e salva il file man mano, così il lavoro non si perde se ti interrompi.
> 3. Verifica con Python, scrivendo gli script in una cartella temporanea e non nel progetto: ricalcola ogni risposta calcolabile e ogni distrattore con funzioni implementate come nella dispensa, ed esegui le soluzioni delle domande aperte su più input, compreso il caso vuoto.
> 4. Esegui `python3 strumenti/valida_formato.py N` e correggi finché non ci sono errori.
> 5. Rileggi ogni spiegazione cercando affermazioni false o troppo generali.
> Regole da ricordare: un codice in `errori` deve corrispondere esattamente alla trappola che produce quell'opzione, altrimenti usa `"altro"`; almeno un distrattore per domanda deve venire da una trappola del tipo. Le domande aperte sono solo funzioni ricorsive, senza versioni iterative. Non modificare nessun file tranne `domande/LNN.json`.
> Rispondi in poche righe: domande per tipo, id delle domande su cui hai dubbi, problemi del catalogo che hai notato (trappole mancanti, esempi sbagliati).

Quando un gruppo finisce, esegui `python3 strumenti/valida_formato.py` sulle sue lezioni. Se un file ha errori di formato, rimandalo allo stesso agente (SendMessage) con l'elenco degli errori, oppure correggili tu se sono pochi e meccanici.

## Fase 2: revisione

Dopo la generazione, lancia un revisore per ogni lezione da 3 a 15: modello **opus**, impegno **high** (per le lezioni 4 e 5 **xhigh**), sempre in gruppi di al più 4. Il revisore non ha visto la generazione, così non giudica il proprio lavoro.

Prompt per ogni revisore:

> Sei il revisore delle domande della lezione N per un sito di allenamento al test di sbarramento di Algoritmi 1. Un altro modello le ha generate in `domande/LNN.json` seguendo `ISTRUZIONI_VARIANTI.md` e il catalogo `dati/tipi_LNN_*.json`. Leggi questi tre file e `dati/schema.json`. Uno studente che sbaglia per colpa di una domanda errata impara una cosa falsa: la correttezza viene prima di tutto.
> Controlla **ogni** domanda, una per una:
> 1. **Risposta corretta**: è giusta? È l'unica giusta, anche leggendo il testo in modo diverso (per esempio O e Θ entrambe vere, due opzioni nella stessa classe)? Ricalcola con Python tutto ciò che è calcolabile (tracce di heap, hash, ABR, AVL, visite, partizioni, passate dei sort, conteggi di iterazioni, valori restituiti), con funzioni implementate come nella dispensa e secondo le convenzioni di `schema.json`.
> 2. **Testo autosufficiente**: tutte le variabili sono definite (f e g dette esplicitamente, variabili del codice inizializzate), le convenzioni sono indicate (min/max-heap, indici, funzione hash, quale cancellazione).
> 3. **Impostazione**: la domanda appartiene davvero al suo tipo; non contraddice una trappola del tipo (esempio di errore trovato in L02: un "caso migliore" che dipendeva solo dal valore di n, mentre caso migliore e peggiore si confrontano a parità di n).
> 4. **Spiegazione**: nessuna affermazione falsa o troppo generale ("sempre", "mai"). Esempi di errori trovati in L01 e L02: "n^(3/2) cresce più di n²"; "n^10 è sempre sotto 2ⁿ" (vale solo da n = 59); "il ciclo esterno fa n iterazioni" quando ne fa log n.
> 5. **Codici in `errori`**: ogni codice corrisponde esattamente alla trappola che produce quell'opzione? Se no, metti `"altro"`, oppure cambia il distrattore perché venga da una trappola. Almeno un distrattore per domanda deve venire da una trappola. Se una trappola reale e frequente manca dal catalogo, puoi aggiungerla **in fondo** alla lista `trappole` del tipo e usarla.
> 6. **Domande aperte**: la soluzione è ricorsiva, corretta (eseguila su più input, compreso il caso vuoto), nello stile della dispensa, senza variabili globali; i `controlli` sono concreti e utili.
> 7. **Qualità**: niente copie dell'`esempio` del catalogo; distrattori plausibili e di forma simile alla risposta giusta.
> Correggi direttamente `domande/LNN.json` (e il catalogo solo come detto al punto 5). Alla fine esegui `python3 strumenti/valida_formato.py N` e correggi finché non ci sono errori.
> Scrivi `revisione/LNN.md` con: numero di domande controllate; elenco delle correzioni, divise in "errori veri" (risposta sbagliata, due risposte giuste, testo incompleto, spiegazione falsa) e "codici o stile"; trappole aggiunte al catalogo; dubbi rimasti, con l'id della domanda. Rispondi a me in tre righe con i numeri principali.

## Fase 3: chiusura

1. Esegui `python3 strumenti/valida_formato.py` su tutte le lezioni: deve dare OK ovunque.
2. Scrivi `revisione/RIEPILOGO.md` con una tabella per lezione: domande, modello di generazione, errori veri trovati in revisione, correzioni di codici o stile, trappole aggiunte, dubbi aperti. Sotto la tabella elenca i dubbi aperti con il loro id e, se lo stesso tipo di errore si è ripetuto in più lezioni, descrivilo in una frase.
3. Rispondimi in poche righe: lezioni completate, totale delle domande, numero di errori veri corretti, dove servono ancora i miei occhi.
