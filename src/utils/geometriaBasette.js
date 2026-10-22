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

// Punto del segmento a-b più vicino a (px, py).
function puntoSulSegmento(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax;
  const dy = by - ay;
  const lunghezza2 = dx * dx + dy * dy;
  const t = lunghezza2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lunghezza2));
  return [ax + t * dx, ay + t * dy];
}

function distanzaPuntoSegmento(px, py, a, b) {
  const [qx, qy] = puntoSulSegmento(px, py, a, b);
  return Math.hypot(px - qx, py - qy);
}

// Punto del bordo di un poligono più vicino a (px, py).
export function puntoBordoPiuVicino(px, py, { punti }) {
  let migliore = null;
  let minima = Infinity;
  for (let i = 0; i < punti.length; i++) {
    const q = puntoSulSegmento(px, py, punti[i], punti[(i + 1) % punti.length]);
    const d = Math.hypot(px - q[0], py - q[1]);
    if (d < minima) {
      minima = d;
      migliore = q;
    }
  }
  return { x: migliore[0], y: migliore[1] };
}

// Punto del bordo di un poligono convesso nella direzione dal suo centro verso (px, py): il più a bordo in quella direzione.
export function puntoBordoVerso(px, py, poligono) {
  let dx = px - poligono.x;
  let dy = py - poligono.y;
  if (dx === 0 && dy === 0) dx = 1;
  const { punti } = poligono;
  let migliore = 0;
  for (let i = 0; i < punti.length; i++) {
    const [ax, ay] = punti[i];
    const [bx, by] = punti[(i + 1) % punti.length];
    const ex = bx - ax;
    const ey = by - ay;
    const det = dx * ey - dy * ex;
    if (det === 0) continue;
    const t = ((ax - poligono.x) * ey - (ay - poligono.y) * ex) / det;
    const u = ((ax - poligono.x) * dy - (ay - poligono.y) * dx) / det;
    if (u >= -1e-9 && u <= 1 + 1e-9 && t > migliore) migliore = t;
  }
  return { x: poligono.x + dx * migliore, y: poligono.y + dy * migliore };
}

// Coppia di punti (uno per bordo) più vicini tra due poligoni convessi; stesso punto se si toccano o si sovrappongono.
export function coppiaBordiPiuVicina(a, b) {
  if (siSovrappongono(a, b)) {
    const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    return { da: m, a: m };
  }
  let migliore = null;
  let minima = Infinity;
  for (const [pa, pb, invertita] of [
    [a, b, false],
    [b, a, true],
  ]) {
    for (const [px, py] of pa.punti) {
      const q = puntoBordoPiuVicino(px, py, pb);
      const d = Math.hypot(px - q.x, py - q.y);
      if (d < minima) {
        minima = d;
        migliore = invertita ? { da: q, a: { x: px, y: py } } : { da: { x: px, y: py }, a: q };
      }
    }
  }
  return migliore;
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
