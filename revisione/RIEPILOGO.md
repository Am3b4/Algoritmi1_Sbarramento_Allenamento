# Riepilogo generazione e revisione L03–L15

Validazione finale (`PYTHONUTF8=1 python strumenti/valida_formato.py`): **OK su tutte le lezioni L01–L15**. Restano solo 4 avvisi su L15-T08 ("la spiegazione cita una lettera"), che sono falsi positivi: la regex legge `bf(a)` come l'opzione "(a)".

Generazione con Sonnet (`claude-sonnet-5-5`) o Haiku (`claude-haiku-5-5`), come nella tabella del prompt. L03 era già stato generato con Sonnet in una sessione precedente: non l'ho rigenerato, è stato solo revisionato. Revisione con Opus: impegno high, xhigh per L04 e L05.

| Lezione | Domande | Generazione | Errori veri | Codici o stile | Trappole aggiunte | Dubbi aperti |
| --- | ---: | --- | ---: | ---: | ---: | ---: |
| L03 | 84 | sonnet (già presente) | 10 | 6 | 1 (T08 E6) | 5 |
| L04 | 73 | sonnet, xhigh | 4 | 21 | 1 (T03 E6) | 6 |
| L05 | 93 | sonnet, xhigh | 7 | 22 | 1 (T06 E5) | 6 |
| L06 | 84 | haiku, medium | 12 | 30 | 2 (T09 E6, E7) | 7 |
| L07 | 100 | haiku, medium | 26 | ~45 | 4 (T05 E5, T08 E5, T10 E4, T16 E5) | 7 |
| L08 | 86 | haiku, medium | 11 | 37 | 2 (T10 E5, T11 E5) | 6 |
| L09 | 79 | haiku, medium | 25 | ~15 | 2 (T01 E5, T07 E6) | 6 |
| L10 | 93 | sonnet, high | 18 | 15 | 4 (T02 E4, T05 E5, T06 E5, T11 E5) | 8 |
| L11 | 48 | haiku, medium | 13 | 16 | 1 (T04 E4) | 6 |
| L12 | 116 | sonnet, high | 7 | 12 | 3 (T08 E5, T11 E5, T20 E5) | 10 |
| L13 | 112 | haiku, medium | 14 | 38 | 1 (T18 E5) | 7 |
| L14 | 116 | sonnet, high | 9 | 23 | 1 (T03 E5) | 5 |
| L15 | 75 | sonnet, high | 21 | 14 | 3 (T10 E6, E7, T13 E5) | 6 |
| **Totale** | **1159** | | **177** | **~294** | **26** | **85** |

- Errori veri nelle lezioni generate con Haiku: 101 su 509 domande, circa il 20%.
- Errori veri nelle lezioni generate con Sonnet: 76 su 650 domande, circa il 12%.
- Nessuna domanda aveva la risposta corretta calcolata male: tracce, simulazioni e soluzioni aperte dei generatori erano giuste ovunque.
- Gli errori veri sono due risposte giuste, testi incompleti, spiegazioni false o distrattori con un valore sbagliato.
- Per ogni catalogo ho controllato con uno script che le trappole esistenti non siano cambiate e che le aggiunte siano solo in fondo. Per L07 e L08 il controllo non è stato possibile, perché mancava una copia del catalogo prima della revisione; i revisori dichiarano solo aggiunte in fondo.

## Errori ripetuti in più lezioni

- **Distrattori in O grande (o Ω) veri come limiti, quindi due risposte giuste.** È il difetto più frequente: 15 domande in L09, 9 in L11, 6 in L10, 4 in L13, 3 in L12, 3 in L15, 2 in L14, e altre in L06 e L08. Esempio: O(n²) accanto alla risposta O(n). I revisori sono passati a Θ, o a "stima più precisa", oppure hanno sostituito il distrattore.
- **Simboli o convenzioni non definiti nel testo.** Esempi:
  - valori `v29` mai definiti (L13-T14);
  - `Nodo(k)` non definito (L10);
  - max-heap non dichiarato (L09);
  - segno del fattore di bilanciamento mancante in 12 testi (L15);
  - costanti positive non dette (L05);
  - quale cancellazione usare (L14);
  - base del logaritmo (L04).
- **Quasi copie dell'`esempio` del catalogo**, riscritte in tutte le lezioni (da 2 a 11 per lezione).

## Dubbi aperti

Ogni voce è spiegata nel file `revisione/LNN.md` della lezione.

**L03**
- T03-02: un distrattore nasce sia da E1 sia da E2.
- T04-03 e T08-01, T08-03 e T11-04: coppie quasi duplicate.
- T12-06: distrattore lasciato `altro`.
- T14-01: struttura vicina all'esempio.
- T10-05: tempi misurati a n fissato.

**L04**
- T04-07: stesse opzioni dell'esempio, tenuta.
- T09-02 e T03-01: schema dell'esempio.
- T08-06: codice E3 usato al contrario.
- Codici a doppia trappola: T04-01/06, T02-01/08, T09-03, T11-01/03/06.
- T10-03 e T10-06: `altro`.

**L05**
- Codici a doppia trappola: T04-02/04/08, T03-03, T06-01, T07-05, T11-01/03/05.
- T09-06: fuori dalla descrizione del tipo, tenuta.
- T01-01: vicina alla prova di maggio.
- T13-01/02 e T12-01: schema dell'esempio.

**L06**
- T09-03 e T09-06: costo dello slicing.
- T12-02: ristretta a due strategie.
- T14-04, T02-06: codici per analogia.
- T04-04: Θ(n²) su lista concatenata.

**L07**
- T15-01…06: E2 ed E4 danno sempre lo stesso indice e non si possono separare.
- T14-03/04: "circa … passi" con n concreti.
- T13-01: frase sulla dispensa non verificabile.
- T10-03: dipende dall'implementazione.
- T01-02/03, T02-01/03, T03-02: array già ordinato tra le opzioni.
- T09-02: distrattori deboli.
- T06-06: vicina all'esempio.

**L08**
- T09-01/02/05: codici E2/E3 ambigui.
- T08-03/05: interpretazione di E5.
- T03-03: doppia trappola.
- T07-02, T08-06: vicine all'esempio.
- T14-02, T15-02: stack O(log n) "in media".

**L09**
- T05-01/02: E1 ed E2 coincidono.
- T09-01/02/03: E5 interpretato.
- T13-02: Θ(n log n) su input ordinato, verificato solo empiricamente.
- T03-02/03: due `altro`.
- T04-03, T01: varianti poco diverse tra loro.

**L10**
- T10-02: CreaR è Θ(n) solo senza slicing (manca la dispensa per verificarlo).
- T09-01/06: Inserisci ricostruita dal catalogo.
- T03-06, T03-07, T05-01, T12-02, T01-02: codici o vicinanza all'esempio.

**L11**
- T03-01, T01-02: vicine all'esempio.
- T01-03/06, T07-02, T05-05: distrattori deboli o codici per analogia.
- T04-03, T05-06, T06-01: O(1) ammortizzato.

**L12**
- T19-01/05: formule "da 1" codificate E1.
- T11-06: chiavi negative non rappresentabili nella notazione.
- T07-02, T10-01, T19-01, T21-01, T03-06: schema dell'esempio.
- T01-03/04/06: stesso albero.
- T03-03, T08-01, T20-07: distrattori `altro`.

**L13**
- T09-02/03: Θ invece di O(1 + α) della dispensa.
- T15-02/04: `altro`.
- T16-04/06: nessuna chiave scavalca chiavi con hash diverso.
- T13-01…06: tutte ricerche con insuccesso.
- T10-04, T08-01/03: vicine al catalogo.
- T01-04: risposta giusta più lunga delle altre.

**L14**
- T11-02/04/06: E4 interpretata in senso largo.
- T12-03: caso speculare di E2 (successore) lasciato `altro`.
- T06-04: distrattore `altro`.
- T01-04: codici E2/E3 per la forma "NON è un ABR".

**L15**
- T10-06, T10-02: codici E1 dipendenti dall'interpretazione.
- T05-03: conclusione giusta con motivazione falsa.
- T14-03: chiede anche la proprietà di ABR.
- T01-02: E1 parla di AVL, non di "bilanciato".
- T13-03, T10-01: `altro`.

## Correzioni ai cataloghi dopo la revisione

I revisori potevano solo aggiungere trappole in fondo. Questi altri campi li ho corretti dopo, senza toccare `trappole` né il blocco `lezione`; uno script ha controllato che fossero cambiati solo i campi elencati qui.

**Frasi false o imprecise**
- **L06-T01 `conoscenze`**: "Θ(n) vale solo per il caso pessimo". Ora dice che anche il caso medio è Θ(n) e che Θ(n) non vale nel caso ottimo.
- **L06-T08 `conoscenze`**: "il caso medio differisce dal massimo di meno di uno". Ora precisa che vale nel modello della dispensa; rispetto al massimo esatto, ⌊log₂ n⌋ + 1, la differenza è meno di due.
- **L09-T04 `conoscenze`**: "non c'è un cammino radice-foglia che porti al minimo". Ora: il minimo sta su qualche cammino, ma non si sa quale.
- **L10-T13 `conoscenze` ed esempio, L10-T18 `conoscenze`**: la fusione ora è O(n + m), Θ(n + m) nel caso peggiore.
- **L12-T20 `conoscenze`**: la radice si trova in O(n) scandendo il vettore oppure in O(h) risalendo da un nodo qualsiasi.
- **L12-T16 `conoscenze`**: aggiunto che l'albero vuoto è completo e quasi completo, come nelle soluzioni.

**Istruzioni per i generatori**
- **L05-T02 `come_generare_varianti`**: Θ(f(n)·log n) va usato come distrattore solo nei casi 1 e 3.
- **L05-T14 `come_generare_varianti`**: per 4T(n/2) + a il vincolo è d ≥ a/3.
- **L07-T08 `come_generare_varianti`**: con le ultime 5 posizioni disordinate, Bubble con flag è Θ(n) solo se gli elementi si spostano di poco; il testo deve dire dove vanno.
- **L14-T04 `come_generare_varianti`**: le opzioni vanno in Θ, non in O.

**Esempi con più di una risposta giusta**, perché le opzioni in O o Ω erano vere anch'esse:
- L06-T03: ora chiede il limite inferiore più alto che vale.
- L09-T04, L09-T11, L09-T12, L14-T04, L14-T14, L15-T13: opzioni passate a Θ.

**Altro**
- **L05-T15 esempio**: la spiegazione non cita più le lettere c e d.
- **L13-T16 `fonte`**: chiarito che la domanda di luglio sugli ABR appartiene a L14.

**Resta aperto**, perché le trappole non si possono cancellare né riordinare: alcune coppie producono sempre la stessa opzione. Sono L04-T09 E1/E5, L05-T04 E1/E2, L07-T15 E2/E4, L09-T05 E1/E2 e L15-T10 E2/E3. Le domande riportano un solo codice, quindi le statistiche non distinguono i due errori.
