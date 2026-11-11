# Istruzioni: catalogo dei tipi di domanda per una lezione

Stai lavorando a un progetto per uno studente di Informatica (Sapienza) che deve superare il **test di sbarramento di Algoritmi 1** (docenti T. Calamoneri e A. Monti). Il test: 15 domande in 15 minuti, risposta esatta +2, errata −1, non data 0, soglia 18/30. 14 domande sono a risposta multipla con 4 opzioni e una sola corretta; una domanda per prova è aperta e chiede sempre di scrivere una funzione ricorsiva (su un intero, una lista concatenata o un albero). Lo studente ha mancato la soglia di un punto (17/30) e si prepara per la prossima sessione.

Il progetto costruirà un sito di allenamento che registra gli errori **per tipo di domanda**. Il tuo compito: per UNA lezione, scrivere il catalogo dei **tipi** di domanda che possono uscire, descritti bene. **Non** scrivere varianti: le varianti verranno generate dopo da un altro modello, seguendo le istruzioni che scrivi tu.

## File da leggere prima di iniziare

- `/home/claude/algoritmi1-allenamento/dati/schema.json` — significato di ogni campo. Rispettalo alla lettera.
- `/home/claude/algoritmi1-allenamento/dati/tipi_L02_costo_iterativi.json` — **file modello**: stessa struttura, stesso livello di dettaglio, stesso stile. Leggilo tutto.
- Il testo della tua dispensa (percorso nel messaggio che ricevi). È un'estrazione del PDF: le formule possono essere spezzate su più righe. Se un passaggio non è chiaro (formule, figure, alberi disegnati), apri il PDF originale con il tool Read usando il parametro `pages`.
- Le due prove ufficiali di sbarramento, con soluzioni:
  - `/home/claude/algoritmi1-allenamento/fonti/sbarramento_maggio_2026.txt`
  - `/home/claude/algoritmi1-allenamento/fonti/sbarramento_luglio_2026.txt` (solo la parte "Test di sbarramento"; il resto è lo scritto)

## Cosa produrre

Un solo file JSON, nel percorso indicato nel messaggio, con questa forma:

```json
{
  "_schema": "schema.json",
  "lezione": { "numero": N, "titolo": "...", "file": "PLN.pdf", "contenuti": ["..."], "nota": "facoltativa" },
  "tipi": [ { ...un oggetto per tipo, con TUTTI i campi dello schema... } ]
}
```

Campi di ogni tipo (vedi schema.json e il file modello): `id`, `titolo`, `argomento`, `formato`, `frequenza`, `difficolta`, `fonte`, `descrizione`, `conoscenze` (lista), `procedimento` (lista), `trappole` (lista), `come_generare_varianti`, `esempio` (oggetto con `domanda`, `opzioni` = esattamente 4 stringhe, `corretta` = "a"/"b"/"c"/"d", `spiegazione`). Per un tipo con `formato` = "aperta", `esempio` ha invece `domanda`, `soluzione` (pseudocodice in stile Python, come nella dispensa) e `spiegazione`, senza `opzioni` né `corretta`.

## Regole

1. **Copertura**: ogni concetto, algoritmo, costo, definizione, esempio ed esercizio della dispensa che può diventare una domanda deve ricadere in almeno un tipo. Di norma 10–16 tipi per lezione (meno se la dispensa è breve). Un tipo = un meccanismo di ragionamento distinto: non spezzare in tipi diversi domande che si risolvono allo stesso modo, e non unire meccanismi diversi.
2. **id**: `LNN-TMM` con numero di lezione a due cifre (L03, L10…) e progressivo (T01, T02…). Stabili, senza buchi.
3. **Domande aperte**: la domanda aperta è sempre una funzione ricorsiva da scrivere (visita in pre-order a maggio, potenza ricorsiva 3ⁿ a luglio). Crea tipi con `formato` "aperta" solo per funzioni ricorsive su un intero (L03), su liste concatenate (L10) o su alberi (L12, L14, L15). Nelle altre lezioni non ci sono tipi aperti: il codice si chiede come domanda a risposta multipla (tracciare, completare, trovare l'errore, dare il costo).
4. **frequenza**: "alta" solo se una domanda quasi identica compare in una delle due prove ufficiali (citala in `fonte`, con mese e numero di domanda); "media" se è un contenuto centrale della dispensa; "bassa" se marginale.
5. **fonte**: cita i lucidi della dispensa (titolo del lucido o numero dell'esempio/esercizio) e le eventuali domande delle prove ufficiali.
6. **Correttezza**: gli esempi devono essere giusti al 100%. Ogni traccia (heap, hash, ABR, visite, ricorrenze, cicli) va verificata eseguendo davvero il calcolo, possibilmente con un piccolo script Python (con `python3` da Bash; scrivi gli script nella cartella `/tmp/claude-0/-home-claude/35c9922d-356c-522d-b0e7-b4a0d8484097/scratchpad`). Segui le convenzioni della dispensa (per esempio altezza dell'albero vuoto = −1, cancellazione da ABR con il successore, heap con indici da 0, figli 2i+1 e 2i+2).
7. **Distrattori**: le opzioni sbagliate dell'esempio devono corrispondere alle trappole elencate (errori veri che uno studente fa), non a valori a caso. Varia la posizione della risposta corretta tra a, b, c, d nei diversi tipi.
8. **come_generare_varianti**: istruzioni operative per un altro modello: cosa far variare, con quali valori, quali vincoli rispettare perché la risposta corretta sia unica, come costruire ciascun distrattore.
9. **Lingua e stile**: italiano, frasi brevi e chiare, terminologia della dispensa. Notazione con caratteri Unicode (Θ, Ω, ≤, ², log₂). Niente emoji.
10. **Confini con le altre lezioni** (non creare tipi che appartengono a un'altra lezione; un richiamo nel campo `fonte` va bene):
    - L01 notazione asintotica e somme; L02 costo degli algoritmi iterativi e operazioni Python
    - L03 funzioni ricorsive (scrittura, ricorrenza associata, spazio dello stack, esempi della dispensa)
    - L04 risolvere ricorrenze: metodo iterativo e metodo dell'albero
    - L05 risolvere ricorrenze: metodo di sostituzione e teorema principale
    - L06 ricerca lineare e binaria
    - L07 selection, insertion, bubble sort, limite inferiore Ω(n log n), counting sort, bucket sort
    - L08 mergesort e quicksort
    - L09 heap e heapsort
    - L10 liste concatenate
    - L11 pile e code
    - L12 alberi binari, visite, rappresentazioni
    - L13 dizionari e tabelle hash
    - L14 alberi binari di ricerca
    - L15 alberi AVL
11. **Errori ricorrenti dello studente** (usali per trappole e distrattori dove pertinenti): sceglie spesso il costo "ottimista" ignorando costi nascosti (slicing, `in` su lista, `pop(0)`, concatenazioni) e casi peggiori (quicksort su input ordinato, ABR degenere); nelle tracce di heappop si ferma dopo il primo scambio o scambia con il figlio sbagliato; confonde heapify O(n) con n inserimenti O(n log n); nel teorema principale non calcola prima n^(log_b a); moltiplica invece di sommare quando il ciclo interno dipende da una variabile che raddoppia o dimezza; nella scansione lineare dimentica il modulo m; nelle ricorsioni su alberi usa `None → True` come caso base o dimentica il controllo su None; scrive ricorrenze facendo la media delle chiamate invece della somma.

## Verifica finale (obbligatoria)

Prima di finire, esegui uno script Python che carichi il tuo file e controlli: JSON valido; id unici e nel formato giusto; tutti i campi presenti; per le multiple esattamente 4 opzioni e `corretta` in a–d; per le aperte presenti `soluzione` e `spiegazione`. Correggi finché passa.

## Risposta finale

Rispondi in poche righe: percorso del file, numero di tipi, elenco `id — titolo`, ed eventuali dubbi (passaggi della dispensa poco chiari, concetti che hai lasciato fuori e perché).
