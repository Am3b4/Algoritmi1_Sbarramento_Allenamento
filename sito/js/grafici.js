// Grafico dell'andamento delle simulazioni: punteggi, media delle ultime cinque, soglia.

import { CONFIG } from './config.js';
import { el, svg, sostituisci, voto, formatData, formatDataOra, numero } from './util.js';
import { mediaMobile } from './statistiche.js';

const ALTEZZA = 220;
const MARGINE = { sopra: 14, destra: 14, sotto: 26, sinistra: 30 };

export function graficoAndamento(simulazioni) {
  const medie = mediaMobile(simulazioni);
  const tela = el('div.tela');
  const fumetto = el('div.fumetto', { hidden: true });
  const grafico = el('div.grafico', {},
    el('div.legenda', {},
      el('span.voce', {}, el('span.chiave.s1', { 'aria-hidden': 'true' }), 'Punteggio'),
      simulazioni.length > 1 ? el('span.voce', {}, el('span.chiave.s2', { 'aria-hidden': 'true' }), 'Media delle ultime 5') : null),
    tela, fumetto);

  let disegnata = 0;
  function disegna() {
    const larghezza = Math.max(260, tela.clientWidth);
    if (larghezza === disegnata) return;
    disegnata = larghezza;
    const n = simulazioni.length;
    const minimo = Math.min(0, Math.floor(Math.min(...simulazioni.map(s => s.punteggio)) / 10) * 10);
    const interno = { x: MARGINE.sinistra, y: MARGINE.sopra, w: larghezza - MARGINE.sinistra - MARGINE.destra, h: ALTEZZA - MARGINE.sopra - MARGINE.sotto };
    const x = i => interno.x + (n === 1 ? interno.w / 2 : (i * interno.w) / (n - 1));
    const y = v => interno.y + interno.h * (1 - (v - minimo) / (CONFIG.massimo - minimo));
    const linea = valori => valori.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

    const disegno = svg('svg', { viewBox: `0 0 ${larghezza} ${ALTEZZA}`, width: larghezza, height: ALTEZZA, role: 'img',
      'aria-label': `Punteggi di ${n} simulazioni; i valori sono nella tabella dello storico qui sotto.` });

    for (let v = minimo; v <= CONFIG.massimo; v += 10) {
      disegno.append(
        svg('line', { class: v === 0 ? 'base' : 'riga-griglia', x1: interno.x, x2: interno.x + interno.w, y1: y(v), y2: y(v) }),
        svg('text', { class: 'tacca', x: interno.x - 6, y: y(v), 'text-anchor': 'end', 'dominant-baseline': 'central' }, v < 0 ? `−${-v}` : v));
    }
    const etichette = n === 1 ? [0] : n === 2 ? [0, 1] : [0, Math.floor((n - 1) / 2), n - 1];
    for (const i of etichette) {
      const ancora = n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
      disegno.append(svg('text', { class: 'tacca', x: x(i), y: ALTEZZA - 8, 'text-anchor': ancora }, formatData(simulazioni[i].quando)));
    }

    disegno.append(
      svg('line', { class: 'soglia', x1: interno.x, x2: interno.x + interno.w, y1: y(CONFIG.soglia), y2: y(CONFIG.soglia) }),
      svg('text', { class: 'etichetta-soglia', x: interno.x + 4, y: y(CONFIG.soglia) - 5 }, `Soglia ${CONFIG.soglia}`));

    const mirino = svg('line', { class: 'mirino', y1: interno.y, y2: interno.y + interno.h, visibility: 'hidden' });
    disegno.append(mirino);
    if (n > 1) disegno.append(svg('path', { class: 'serie s2', d: linea(medie) }));
    if (n > 1) disegno.append(svg('path', { class: 'serie s1', d: linea(simulazioni.map(s => s.punteggio)) }));
    const punti = simulazioni.map((s, i) => svg('circle', { class: 'punto', cx: x(i), cy: y(s.punteggio), r: 4 }));
    disegno.append(...punti);

    function mostra(evento) {
      const riquadro = disegno.getBoundingClientRect();
      const px = evento.clientX - riquadro.left;
      const i = n === 1 ? 0 : Math.max(0, Math.min(n - 1, Math.round(((px - interno.x) / interno.w) * (n - 1))));
      const s = simulazioni[i];
      mirino.setAttribute('x1', x(i));
      mirino.setAttribute('x2', x(i));
      mirino.setAttribute('visibility', 'visible');
      punti.forEach((p, j) => p.setAttribute('r', j === i ? 6 : 4));
      sostituisci(fumetto,
        el('div.quando', {}, `Simulazione ${i + 1} · ${formatDataOra(s.quando)}`),
        el('div', {}, el('span.chiave.s1', { 'aria-hidden': 'true' }), el('strong', {}, voto(s.punteggio)), ` su ${CONFIG.massimo} · ${s.punteggio >= CONFIG.soglia ? 'superata' : 'non superata'}`),
        n > 1 ? el('div', {}, el('span.chiave.s2', { 'aria-hidden': 'true' }), el('strong', {}, numero(medie[i])), ' media delle ultime 5') : null);
      fumetto.hidden = false;
      const meta = fumetto.offsetWidth / 2;
      fumetto.style.left = `${Math.max(meta, Math.min(larghezza - meta, x(i)))}px`;
      fumetto.style.top = `${Math.min(y(s.punteggio), y(medie[i])) - 10}px`;
    }
    function nascondi() {
      mirino.setAttribute('visibility', 'hidden');
      punti.forEach(p => p.setAttribute('r', 4));
      fumetto.hidden = true;
    }
    disegno.addEventListener('pointermove', mostra);
    disegno.addEventListener('pointerdown', mostra);
    disegno.addEventListener('pointerleave', nascondi);
    tela.replaceChildren(disegno);
  }

  // Il grafico si ridisegna alla larghezza reale del contenitore, così i testi non si rimpiccioliscono.
  new ResizeObserver(disegna).observe(tela);
  return grafico;
}
