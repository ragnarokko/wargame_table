import { calcolaDimensioniBasettaPx } from './basetta';

// Lati dell'ellisse con cui si approssimano le basette tonde e ovali (errore sul bordo < 0,5%).
const LATI_ELLISSE = 32;

// Poligono convesso (vertici in px, nelle coordinate del `containerRef`) di una basetta sul campo: ellisse
// per le basette tonde/ovali, rettangolo per le rettangolari, ruotato di `istanza.rotazione` attorno al
// centro (x, y). `raggio` è il raggio del cerchio che lo contiene, usato per scartare in fretta le coppie lontane.
export function poligonoBasetta(istanza, template, pxPerPollice) {
  const { larghezza, altezza } = calcolaDimensioniBasettaPx(template, pxPerPollice);
  const mx = larghezza / 2;
  const my = altezza / 2;
  const locali =
    template.forma === 'rettangolare'
      ? [
          [-mx, -my],
          [mx, -my],
          [mx, my],
          [-mx, my],
        ]
      : Array.from({ length: LATI_ELLISSE }, (_, i) => {
          const angolo = (2 * Math.PI * i) / LATI_ELLISSE;
          return [mx * Math.cos(angolo), my * Math.sin(angolo)];
        });
  const rad = ((istanza.rotazione ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: istanza.x,
    y: istanza.y,
    raggio: Math.hypot(mx, my),
    punti: locali.map(([px, py]) => [istanza.x + px * cos - py * sin, istanza.y + px * sin + py * cos]),
  };
}

// Distanza con segno di un punto dal bordo di un poligono convesso (vertici in senso orario o antiorario):
// negativa se il punto è dentro.
export function distanzaConSegno(px, py, { punti }) {
  let minima = Infinity;
  let positivi = 0;
  let negativi = 0;
  for (let i = 0; i < punti.length; i++) {
    const a = punti[i];
    const b = punti[(i + 1) % punti.length];
    minima = Math.min(minima, distanzaPuntoSegmento(px, py, a, b));
    const croce = (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
    if (croce > 0) positivi++;
    else if (croce < 0) negativi++;
  }
  return positivi === 0 || negativi === 0 ? -minima : minima;
}

function distanzaPuntoSegmento(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lunghezza2 = dx * dx + dy * dy;
  const t = lunghezza2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lunghezza2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// Due poligoni convessi disgiunti: la distanza minima è sempre tra un vertice di uno e un lato dell'altro.
function distanzaBordi(a, b) {
  let minima = Infinity;
  for (const [da, db] of [
    [a, b],
    [b, a],
  ]) {
    for (const [px, py] of da.punti) {
      for (let i = 0; i < db.punti.length; i++) {
        const d = distanzaPuntoSegmento(px, py, db.punti[i], db.punti[(i + 1) % db.punti.length]);
        if (d < minima) minima = d;
      }
    }
  }
  return minima;
}

// Teorema dell'asse separatore (poligoni convessi): vero se non esiste un asse che li separa, cioè si toccano o si sovrappongono.
function siSovrappongono(a, b) {
  for (const poligono of [a, b]) {
    for (let i = 0; i < poligono.punti.length; i++) {
      const [x1, y1] = poligono.punti[i];
      const [x2, y2] = poligono.punti[(i + 1) % poligono.punti.length];
      const nx = y2 - y1;
      const ny = x1 - x2;
      let minA = Infinity;
      let maxA = -Infinity;
      let minB = Infinity;
      let maxB = -Infinity;
      for (const [x, y] of a.punti) {
        const p = x * nx + y * ny;
        minA = Math.min(minA, p);
        maxA = Math.max(maxA, p);
      }
      for (const [x, y] of b.punti) {
        const p = x * nx + y * ny;
        minB = Math.min(minB, p);
        maxB = Math.max(maxB, p);
      }
      if (maxA < minB || maxB < minA) return false;
    }
  }
  return true;
}

// Distanza minima, in pollici, tra due unità: la più piccola tra tutte le coppie di basette (una per unità),
// misurata tra i due punti più vicini dei bordi (0 se si toccano o si sovrappongono). `null` se manca una
// delle due unità sul campo.
export function distanzaMinimaUnita(istanzeA, templateA, istanzeB, templateB, pxPerPollice) {
  if (!istanzeA.length || !istanzeB.length) return null;
  const poligoniA = istanzeA.map((i) => poligonoBasetta(i, templateA, pxPerPollice));
  const poligoniB = istanzeB.map((i) => poligonoBasetta(i, templateB, pxPerPollice));
  let minima = Infinity;
  for (const a of poligoniA) {
    for (const b of poligoniB) {
      const traCentri = Math.hypot(a.x - b.x, a.y - b.y);
      // Anche nel caso migliore (i due cerchi circoscritti che si toccano) questa coppia non batterebbe il minimo trovato.
      if (traCentri - a.raggio - b.raggio >= minima) continue;
      const d = traCentri <= a.raggio + b.raggio && siSovrappongono(a, b) ? 0 : distanzaBordi(a, b);
      if (d < minima) minima = d;
      if (minima === 0) return 0;
    }
  }
  return minima / pxPerPollice;
}
