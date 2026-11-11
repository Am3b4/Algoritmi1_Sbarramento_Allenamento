"""Controllo di formato delle domande generate.
Uso:  python3 strumenti/valida_formato.py            (tutte le lezioni in domande/)
      python3 strumenti/valida_formato.py 9 12       (solo L09 e L12)
Esce con codice 1 se trova errori."""
import json, glob, os, re, sys
from collections import Counter

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUANTE = {'alta': (8, 4), 'media': (6, 3), 'bassa': (3, 2)}
ALBERO = re.compile(r'^[\w\-\s(),.]+$')


def catalogo(n):
    f = glob.glob(os.path.join(RADICE, 'dati', f'tipi_L{n:02d}_*.json'))
    return {t['id']: t for t in json.load(open(f[0], encoding='utf-8'))['tipi']} if f else None


def controlla(n):
    err, avvisi = [], []
    tipi = catalogo(n)
    path = os.path.join(RADICE, 'domande', f'L{n:02d}.json')
    if tipi is None:
        return [f'manca il catalogo della lezione {n}'], []
    if not os.path.exists(path):
        return [f'manca {path}'], []
    try:
        dati = json.load(open(path, encoding='utf-8'))
    except json.JSONDecodeError as e:
        return [f'JSON non valido: {e}'], []
    if dati.get('lezione') != n:
        err.append(f'campo lezione = {dati.get("lezione")}, atteso {n}')
    dom = dati.get('domande', [])
    ids = Counter(d.get('id') for d in dom)
    err += [f'id duplicato {i}' for i, c in ids.items() if c > 1]
    per_tipo = Counter(d.get('tipo') for d in dom)
    for tid, t in tipi.items():
        atteso = QUANTE[t['frequenza']][1 if t['formato'] == 'aperta' else 0]
        if per_tipo[tid] != atteso:
            err.append(f'{tid}: {per_tipo[tid]} domande, attese {atteso}')
    posizioni = {}
    for d in dom:
        i = d.get('id', '?')
        t = tipi.get(d.get('tipo'))
        if t is None:
            err.append(f'{i}: tipo inesistente {d.get("tipo")}')
            continue
        if not re.fullmatch(rf'L{n:02d}-T\d\d-\d\d', i) or not i.startswith(d['tipo'] + '-'):
            err.append(f'{i}: id non valido')
        if d.get('formato') != t['formato']:
            err.append(f'{i}: formato {d.get("formato")}, il tipo è {t["formato"]}')
        if d.get('difficolta') not in (1, 2, 3):
            err.append(f'{i}: difficolta non valida')
        for campo in ('testo', 'spiegazione'):
            if not isinstance(d.get(campo), str) or not d[campo].strip():
                err.append(f'{i}: manca {campo}')
        if 'trappole' in d:
            err.append(f'{i}: campo trappole nella domanda (si usa errori)')
        alb = d.get('albero')
        if alb is not None and (not isinstance(alb, str) or not ALBERO.match(alb) or alb.count('(') != alb.count(')')):
            err.append(f'{i}: albero non nella notazione k(S, D)')
        testo = (d.get('testo') or '') + ' ' + ' '.join(d.get('opzioni') or [])
        if re.search(r'\\[a-zA-Z]+|\$', testo):
            avvisi.append(f'{i}: sembra contenere LaTeX')
        if t['formato'] == 'multipla':
            o, e, c = d.get('opzioni'), d.get('errori'), d.get('corretta')
            if not isinstance(o, list) or len(o) != 4 or len(set(o)) != 4:
                err.append(f'{i}: servono 4 opzioni distinte')
                continue
            if c not in range(4):
                err.append(f'{i}: corretta fuori da 0..3')
                continue
            posizioni.setdefault(d['tipo'], []).append(c)
            if not isinstance(e, list) or len(e) != 4:
                err.append(f'{i}: errori deve avere 4 elementi')
                continue
            if e[c] is not None or e.count(None) != 1:
                err.append(f'{i}: null solo sulla risposta corretta')
            nt = len(t['trappole'])
            for x in e:
                if x is None or x == 'altro':
                    continue
                if not re.fullmatch(r'E\d+', str(x)) or not 1 <= int(x[1:]) <= nt:
                    err.append(f'{i}: codice {x} non valido (il tipo ha {nt} trappole)')
            if not any(x not in (None, 'altro') for x in e):
                err.append(f'{i}: nessun distrattore viene da una trappola (tutti altro)')
            if re.search(r'\b(la risposta|l\'opzione) [a-d]\b|(?<!\w)\([a-d]\)',d.get('spiegazione', '')):
                avvisi.append(f'{i}: la spiegazione cita una lettera')
        else:
            if not isinstance(d.get('soluzione'), str) or 'def ' not in d['soluzione']:
                err.append(f'{i}: manca soluzione con def')
            ctrl = d.get('controlli')
            if not isinstance(ctrl, list) or not 2 <= len(ctrl) <= 5:
                err.append(f'{i}: controlli deve avere 2-5 voci')
            if 'opzioni' in d or 'corretta' in d:
                err.append(f'{i}: una domanda aperta non ha opzioni né corretta')
    for tid, pos in posizioni.items():
        if len(pos) >= 4 and len(set(pos)) == 1:
            avvisi.append(f'{tid}: la risposta corretta è sempre in posizione {pos[0]}')
    return err, avvisi


def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')  # i messaggi contengono lettere accentate
    lezioni = [int(a) for a in sys.argv[1:]] or sorted(
        int(os.path.basename(f)[1:3]) for f in glob.glob(os.path.join(RADICE, 'domande', 'L??.json')))
    totale = 0
    for n in lezioni:
        err, avvisi = controlla(n)
        totale += len(err)
        print(f'L{n:02d}: {"OK" if not err else f"{len(err)} errori"}' + (f', {len(avvisi)} avvisi' if avvisi else ''))
        for x in err:
            print('   ERRORE', x)
        for x in avvisi:
            print('   avviso', x)
    sys.exit(1 if totale else 0)


if __name__ == '__main__':
    main()
