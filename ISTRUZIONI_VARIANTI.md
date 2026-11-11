# Istruzioni: generare le varianti di una lezione

Stai generando le **domande** di un sito di allenamento per il test di sbarramento di Algoritmi 1 (Sapienza, docenti T. Calamoneri e A. Monti). Il test: 15 domande in 15 minuti, +2 se giusta, −1 se sbagliata, 0 se lasciata in bianco, soglia 18/30. 14 domande sono a risposta multipla con 4 opzioni e una sola corretta; una per prova è aperta e chiede sempre di scrivere una funzione ricorsiva (su un intero, una lista concatenata o un albero). Per questo i tipi aperti esistono solo nelle lezioni 3, 10, 12, 14 e 15.

Per ogni lezione esiste già un **catalogo dei tipi** di domanda. Il tuo compito: per UNA lezione, scrivere N varianti di ogni tipo, cioè domande nuove che seguono la descrizione del tipo. Uno studente che sbaglia una domanda per colpa di un errore nostro impara una cosa sbagliata: **la correttezza viene prima di tutto**.

## File da leggere

- `dati/schema.json`: significato dei campi dei tipi e **convenzioni** comuni (notazione degli alberi, altezza −1, heap con indici da 0, cancellazione ABR con il successore, hash con DELETED).
- `dati/tipi_LNN_*.json`: il catalogo della tua lezione. Per ogni tipo usa soprattutto `descrizione`, `conoscenze`, `procedimento`, `trappole`, `come_generare_varianti` ed `esempio`. Leggi anche `lezione.nota`, se c'è: segnala errori della dispensa da non riprodurre.

**Attenzione ai due nomi:** `trappole` è il campo del **catalogo dei tipi** e contiene la descrizione degli errori tipici; `errori` è il campo di **ogni domanda** che generi e contiene solo i codici (`E1`, `E2`, …) che rimandano a quelle descrizioni. Nelle domande non si scrive mai il campo `trappole`.

## Quante varianti

| `frequenza` del tipo | Varianti a risposta multipla | Varianti aperte |
| --- | --- | --- |
| alta | 8 | 4 |
| media | 6 | 3 |
| bassa | 3 | 2 |

Se il messaggio che ricevi indica numeri diversi, valgono quelli del messaggio.

## Formato di uscita

Un file `domande/LNN.json` (NN = lezione a due cifre) con questa forma:

```json
{
  "lezione": 9,
  "generato_con": "nome del modello",
  "domande": [ { ... }, { ... } ]
}
```

### Domanda a risposta multipla

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
  "spiegazione": "Il 10 va in radice. Figli 5 e 4: scambio con 4. Ora all'indice 2 ha figli 8 e 7: scambio con 7. All'indice 6 non ha figli: stop."
}
```

- `id`: id del tipo + `-` + progressivo a due cifre (01, 02, …). Unico.
- `tipo`: id del tipo nel catalogo.
- `difficolta`: 1, 2 o 3, come nello schema. Varia la difficoltà tra le varianti di uno stesso tipo, restando nel perimetro del tipo.
- `testo`: la domanda, senza il codice. Deve stare in piedi da sola: tutti i dati necessari sono nel testo, nel codice o nell'albero.
- `codice`: frammento di codice in stile Python come stringa con `\n`, oppure `null`. Il testo non lo ripete.
- `albero`: albero nella notazione `k(S, D)` delle convenzioni (per esempio `"8(4(2, -), 10)"`), oppure `null`. Se c'è un albero, il testo dice "l'albero in figura".
- `opzioni`: esattamente 4 stringhe, tutte diverse tra loro. Niente lettere a), b) davanti: il sito mescola le opzioni.
- `corretta`: indice (da 0 a 3) dell'opzione giusta. Distribuiscilo: nelle varianti di uno stesso tipo non deve stare sempre nella stessa posizione.
- `errori`: lista parallela a `opzioni`. Per l'opzione corretta `null`; per ogni opzione sbagliata il **codice della trappola** che la produce: `"E1"` è la prima voce di `trappole` del tipo, `"E2"` la seconda, e così via. Se un distrattore non corrisponde davvero a nessuna trappola elencata usa `"altro"` (anche più di una volta), ma almeno un distrattore per domanda deve venire da una trappola del tipo. **Non assegnare mai un codice a una trappola che non produce esattamente quell'opzione**: un codice sbagliato è peggio di `"altro"`. Questi codici permettono al sito di dire allo studente *come* sbaglia: devono essere esatti.
- `spiegazione`: 1–4 frasi. Dice perché la risposta è giusta e, se utile, da quale errore nasce il distrattore più tentatore. Niente "la risposta corretta è la c": le lettere cambiano.

### Domanda aperta

```json
{
  "id": "L12-T12-02",
  "tipo": "L12-T12",
  "formato": "aperta",
  "difficolta": 2,
  "testo": "Scrivere lo pseudocodice di una funzione ricorsiva che, dato il puntatore r alla radice di un albero binario, stampi le chiavi in post-order.",
  "codice": null,
  "albero": null,
  "soluzione": "def postorder(r):\n    if r is None:\n        return\n    postorder(r.left)\n    postorder(r.right)\n    print(r.key)",
  "controlli": ["Caso base: r is None, senza accedere ai campi di r", "Prima il sottoalbero sinistro, poi il destro, infine il nodo", "Nessuna variabile globale"],
  "spiegazione": "Costo Θ(n): ogni nodo è visitato una volta."
}
```

- `soluzione`: pseudocodice completo e corretto, nello stile della dispensa (nomi dei campi come nella dispensa della lezione: `key`, `left`, `right`, `next`; per domande in stile esercizio d'esame `chiave`, `fsin`, `fdes`).
- La soluzione è sempre **ricorsiva**: non scrivere versioni iterative, né chiederle nel testo.
- `controlli`: 2–5 punti concreti che lo studente usa per autovalutarsi (caso base, controllo di None, ordine delle operazioni, valore restituito, assenza di variabili globali). Includi gli errori tipici del tipo.

## Regole per scrivere buone varianti

1. **Segui il tipo.** Ogni variante deve risolversi con il `procedimento` del suo tipo. Se una domanda richiede un ragionamento di un altro tipo, non va bene.
2. **Una sola risposta corretta.** Controlla che nessun distrattore sia anch'esso giusto, anche con una lettura diversa del testo (per esempio O(n²) e Θ(n²) insieme, quando entrambe sono vere). Se due trappole producono la stessa opzione, cambia i dati finché sono diverse.
3. **Distrattori veri.** Ogni opzione sbagliata deve essere il risultato di un errore che uno studente fa davvero (le `trappole` del tipo), non un valore a caso. Le opzioni devono avere forma simile (stessa lunghezza, stesso formato), così la giusta non si riconosce dall'aspetto.
4. **Varietà.** Tra le varianti di uno stesso tipo cambia i numeri, le dimensioni, le funzioni, la formulazione e la posizione della risposta corretta. Almeno una variante per tipo deve contenere il caso limite indicato in `come_generare_varianti` (nessuno scambio, giro in fondo alla tabella, nodo con un solo figlio…).
5. **Non copiare.** Non riprodurre l'`esempio` del tipo né le domande delle prove ufficiali: devono servire da modello di stile, non da contenuto.
6. **Dati piccoli.** Array di 5–9 elementi, alberi di 4–9 nodi, tabelle hash con m tra 5 e 11: lo studente deve risolvere a mano in meno di un minuto.
7. **Lingua.** Italiano, frasi brevi, terminologia della dispensa. Formule con caratteri Unicode (Θ, Ω, ≤, n², log₂ n, ⌊ ⌋), niente LaTeX, niente emoji.
8. **Testi autosufficienti.** Specifica sempre le convenzioni che servono (min-heap o max-heap, indici da 0, h(k) = k mod m, quale cancellazione, versione con o senza flag…).

## Verifica (obbligatoria)

Se puoi eseguire codice, fallo:

1. **Ricalcola ogni risposta** che si può calcolare (tracce di heap, hash, ABR, AVL, visite, ricerca binaria, Partiziona, passate dei sort, valori restituiti da funzioni) con un piccolo script Python che implementa le funzioni **come nella dispensa**. Calcola anche ogni distrattore applicando l'errore corrispondente, e controlla che il codice in `errori` sia quello giusto.
2. **Controlla il formato** con uno script: JSON valido; id unici, nel formato `LNN-TMM-VV` e con il prefisso di un tipo esistente; numero di varianti per tipo come da tabella; per le multiple 4 opzioni distinte, `corretta` tra 0 e 3, `errori` lungo 4 con `null` solo nella posizione corretta e codici esistenti (`E1`…`En` con n = numero di trappole del tipo, oppure `altro`; almeno un codice E per domanda); per le aperte `soluzione` e `controlli` presenti; `albero`, se presente, scritto nella notazione delle convenzioni.
3. **Esegui le soluzioni aperte** su qualche input, compreso il caso vuoto.

4. **Rileggi ogni `spiegazione`** cercando affermazioni false o troppo generali ("sempre", "mai", "ogni"): lo script non le vede.

Correggi finché tutto passa. Se non puoi eseguire codice, ricontrolla a mano ogni traccia due volte, passo per passo.

## Risposta finale

Poche righe: percorso del file, numero di domande per tipo, domande per cui hai dubbi (con l'id), tipi per cui non è stato possibile generare il numero richiesto di varianti diverse e perché.
