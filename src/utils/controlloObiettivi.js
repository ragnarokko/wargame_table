import { poligonoBasetta } from './geometriaBasette';

function puntoInPoligono(px, py, punti) {
  let dentro = false;
  for (let i = 0, j = punti.length - 1; i < punti.length; j = i++) {
    const [xi, yi] = punti[i];
    const [xj, yj] = punti[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dentro = !dentro;
  }
  return dentro;
}

function orientamento([ax, ay], [bx, by], [cx, cy]) {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function latiSiIncrociano(a1, a2, b1, b2) {
  return orientamento(a1, a2, b1) * orientamento(a1, a2, b2) <= 0 && orientamento(b1, b2, a1) * orientamento(b1, b2, a2) <= 0;
}

// Due poligoni qualsiasi (anche concavi) si toccano o si sovrappongono: un lato ne incrocia un altro,
// oppure uno dei due sta tutto dentro l'altro.
function poligoniSiToccano(a, b) {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (latiSiIncrociano(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
    }
  }
  return puntoInPoligono(a[0][0], a[0][1], b) || puntoInPoligono(b[0][0], b[0][1], a);
}

function riquadro(punti) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of punti) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

// Capacità di controllo obiettivo (OC) dei due eserciti su ogni obiettivo del layout: per ciascuno si
// sommano gli OC (da datasheet, `template.oc`) di tutti i modelli, non eliminati, la cui basetta tocca
// anche solo in parte l'area di terreno a cui l'obiettivo è collegato (impronte ed elementi di quell'area).
// Le coordinate del layout sono in pollici sul tavolo del layout e vengono portate in px sul tavolo reale.
// Ritorna [{ numero, blu, rosso }] nell'ordine degli obiettivi.
export function ocPerObiettivo(layout, istanze, basette, tavoloRect, pxPerPollice) {
  const sx = tavoloRect.width / layout.larghezza;
  const sy = tavoloRect.height / layout.altezza;
  const inPx = (punti) => punti.map(([x, y]) => [tavoloRect.left + x * sx, tavoloRect.top + y * sy]);

  const modelli = [];
  for (const istanza of istanze) {
    if (istanza.morta) continue;
    const template = basette.find((b) => b.id === istanza.templateId);
    if (!template || (template.esercito !== 'blu' && template.esercito !== 'rosso')) continue;
    const oc = Number.parseInt(template.oc, 10);
    if (!(oc > 0)) continue;
    const poligono = poligonoBasetta(istanza, template, pxPerPollice);
    modelli.push({ esercito: template.esercito, oc, punti: poligono.punti, riquadro: riquadro(poligono.punti) });
  }

  return layout.obiettivi.map((obiettivo) => {
    const aree = [...layout.impronte, ...layout.elementi].filter((p) => p.area === obiettivo.area).map((p) => inPx(p.punti));
    const totali = { blu: 0, rosso: 0 };
    for (const modello of modelli) {
      const r = modello.riquadro;
      const tocca = aree.some((area) => {
        const a = riquadro(area);
        if (r.maxX < a.minX || r.minX > a.maxX || r.maxY < a.minY || r.minY > a.maxY) return false;
        return poligoniSiToccano(modello.punti, area);
      });
      if (tocca) totali[modello.esercito] += modello.oc;
    }
    return { numero: obiettivo.numero, blu: totali.blu, rosso: totali.rosso };
  });
}
