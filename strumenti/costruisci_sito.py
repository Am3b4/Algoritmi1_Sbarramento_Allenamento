"""Prepara i dati che il sito legge, a partire dai file di lavoro.

Uso:  python strumenti/costruisci_sito.py

Legge   dati/indice.json, dati/tipi_LNN_*.json, domande/LNN.json
Scrive  sito/dati/catalogo.json      (solo i campi dei tipi che servono al sito)
        sito/dati/domande/LNN.json   (le domande, senza spazi inutili)

I file di lavoro restano l'unica copia da modificare: sito/dati/ si rigenera
ogni volta con questo script (lo fa anche il controllo automatico su GitHub).
Esce con codice 1 se una domanda punta a un tipo che non esiste."""
import glob
import json
import os
import shutil
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
USCITA = os.path.join(RADICE, 'sito', 'dati')
# Del catalogo il sito usa solo questi campi; `trappole` serve alla vista "Come sbaglio".
CAMPI_TIPO = ('id', 'titolo', 'argomento', 'formato', 'frequenza', 'difficolta', 'trappole')


def leggi(percorso):
    with open(percorso, encoding='utf-8') as f:
        return json.load(f)


def scrivi(percorso, dati):
    os.makedirs(os.path.dirname(percorso), exist_ok=True)
    with open(percorso, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(dati, f, ensure_ascii=False, separators=(',', ':'))


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    indice = leggi(os.path.join(RADICE, 'dati', 'indice.json'))
    shutil.rmtree(os.path.join(USCITA, 'domande'), ignore_errors=True)

    lezioni, tipi, errori = [], [], []
    totale_domande = 0
    for voce in indice['lezioni']:
        n = voce['lezione']
        catalogo = leggi(os.path.join(RADICE, 'dati', voce['file']))
        ids = set()
        for t in catalogo['tipi']:
            tipo = {c: t[c] for c in CAMPI_TIPO}
            tipo['lezione'] = n
            tipi.append(tipo)
            ids.add(t['id'])

        lezione = {'numero': n, 'titolo': voce['titolo'], 'domande': None}
        sorgente = os.path.join(RADICE, 'domande', f'L{n:02d}.json')
        if os.path.exists(sorgente):
            domande = leggi(sorgente)['domande']
            for d in domande:
                if d.get('tipo') not in ids:
                    errori.append(f'{d.get("id")}: tipo inesistente {d.get("tipo")}')
            nome = f'domande/L{n:02d}.json'
            scrivi(os.path.join(USCITA, nome), {'lezione': n, 'domande': domande})
            lezione['domande'] = nome
            totale_domande += len(domande)
        lezioni.append(lezione)

    scrivi(os.path.join(USCITA, 'catalogo.json'), {'versione': 1, 'lezioni': lezioni, 'tipi': tipi})

    con_domande = sum(1 for l in lezioni if l['domande'])
    print(f'{len(tipi)} tipi, {totale_domande} domande in {con_domande} lezioni -> {os.path.relpath(USCITA, RADICE)}')
    for e in errori:
        print('   ERRORE', e)
    sys.exit(1 if errori else 0)


if __name__ == '__main__':
    main()
