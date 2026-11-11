"""Tiene fuori da git il campo `esempio` dei tipi di domanda.

Alcuni esempi riprendono quasi alla lettera domande delle prove ufficiali, che sono
materiale dei docenti: non vanno pubblicati finché non sono riformulati o autorizzati.
Il sito non li usa; servono solo a chi genera nuove varianti.

Uso:  python strumenti/esempi.py togli     sposta gli esempi da dati/ a fonti/esempi/ (cartella esclusa da git)
      python strumenti/esempi.py rimetti   li riporta in dati/, per lavorare alla generazione
      python strumenti/esempi.py controlla esce con codice 1 se in dati/ c'è ancora un esempio

Prima di un commit gli esempi devono essere tolti: lo verifica anche il controllo automatico."""
import glob
import json
import os
import sys

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESEMPI = os.path.join(RADICE, 'fonti', 'esempi')


def cataloghi():
    return sorted(glob.glob(os.path.join(RADICE, 'dati', 'tipi_L*.json')))


def leggi(percorso):
    """Restituisce i dati e il tipo di a capo del file, per riscriverlo senza altre differenze."""
    with open(percorso, encoding='utf-8', newline='') as f:
        testo = f.read()
    return json.loads(testo), ('\r\n' if '\r\n' in testo else '\n')


def scrivi(percorso, dati, a_capo='\n'):
    os.makedirs(os.path.dirname(percorso), exist_ok=True)
    testo = json.dumps(dati, ensure_ascii=False, indent=2) + '\n'
    with open(percorso, 'w', encoding='utf-8', newline='') as f:
        f.write(testo.replace('\n', a_capo))


def file_esempi(catalogo):
    return os.path.join(ESEMPI, os.path.basename(catalogo))


def togli():
    spostati = 0
    for percorso in cataloghi():
        dati, a_capo = leggi(percorso)
        esempi = {t['id']: t.pop('esempio') for t in dati['tipi'] if 'esempio' in t}
        if not esempi:
            continue
        # Se alcuni esempi erano già stati tolti in precedenza, si aggiungono a quelli.
        if os.path.exists(file_esempi(percorso)):
            esempi = {**leggi(file_esempi(percorso))[0], **esempi}
        scrivi(file_esempi(percorso), esempi)
        scrivi(percorso, dati, a_capo)
        spostati += len(esempi)
    print(f'{spostati} esempi spostati in {os.path.relpath(ESEMPI, RADICE)}')


def rimetti():
    rimessi = 0
    for percorso in cataloghi():
        if not os.path.exists(file_esempi(percorso)):
            continue
        esempi = leggi(file_esempi(percorso))[0]
        dati, a_capo = leggi(percorso)
        for t in dati['tipi']:
            if t['id'] in esempi and 'esempio' not in t:
                t['esempio'] = esempi[t['id']]  # in fondo, dov'era
                rimessi += 1
        scrivi(percorso, dati, a_capo)
    print(f'{rimessi} esempi rimessi in dati/')


def controlla():
    presenti = [t['id'] for percorso in cataloghi() for t in leggi(percorso)[0]['tipi'] if 'esempio' in t]
    if presenti:
        print(f'ERRORE: {len(presenti)} tipi hanno ancora il campo esempio (da {presenti[0]}).')
        print('        Esegui: python strumenti/esempi.py togli')
        sys.exit(1)
    print('OK: nessun esempio in dati/')


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    comandi = {'togli': togli, 'rimetti': rimetti, 'controlla': controlla}
    if len(sys.argv) != 2 or sys.argv[1] not in comandi:
        print(__doc__)
        sys.exit(2)
    comandi[sys.argv[1]]()
