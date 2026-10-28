// Linea del territorio di un layout: la divisione tra le metà del tavolo dei due giocatori, come la disegna
// rapidingress.com ("Territory Line"). Si percorre il bordo del tavolo (CAMPIONI_PER_LATO punti per lato,
// ognuno guardato a DISTANZA_BORDO_POLLICI verso l'interno) e si segna a quale zona di schieramento appartiene;
// i tratti di bordo senza zona compresi tra una zona e l'altra sono i "varchi": la linea unisce i punti medi
// dei due varchi più lunghi. Con meno di due varchi (zone che coprono tutto il bordo, o un solo varco) ripiega
// sulla linea centrale, verticale o orizzontale secondo la posizione relativa delle due zone.
const CAMPIONI_PER_LATO = 220;
const DISTANZA_BORDO_POLLICI = 0.7;

// Test punto-in-poligono (even-odd), poligono come [[x, y], ...].
function dentro(punto, poligono) {
  let in_ = false;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i];
    const [xj, yj] = poligono[j];
    if (yi > punto.y !== yj > punto.y && punto.x < ((xj - xi) * (punto.y - yi)) / (yj - yi) + xi) in_ = !in_;
  }
  return in_;
}

// Centroide dell'area del poligono (media dei vertici se l'area è nulla).
function centroide(poligono) {
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const [xi, yi] = poligono[i];
    const [xj, yj] = poligono[j];
    const f = xj * yi - xi * yj;
    area += f;
    cx += (xj + xi) * f;
    cy += (yj + yi) * f;
  }
  if (Math.abs(area) < 1e-9) {
    return {
      x: poligono.reduce((s, [x]) => s + x, 0) / poligono.length,
      y: poligono.reduce((s, [, y]) => s + y, 0) / poligono.length,
    };
  }
  return { x: cx / (3 * area), y: cy / (3 * area) };
}

// `larghezza`/`altezza` del tavolo e le due zone di schieramento (`zone` = [{ punti: [[x, y], ...] }, ...],
// in pollici, come nei file di `data/layouts`). Restituisce `{ x1, y1, x2, y2 }` in pollici, o null se mancano
// le due zone.
export function lineaTerritorio({ larghezza, altezza, zone }) {
  if (!zone || zone.length < 2 || !zone[0].punti.length || !zone[1].punti.length) return null;
  const zonaA = zone[0].punti;
  const zonaB = zone[1].punti;

  const angoli = [
    { x: 0, y: 0 },
    { x: larghezza, y: 0 },
    { x: larghezza, y: altezza },
    { x: 0, y: altezza },
  ];
  const versoInterno = [
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: 1, y: 0 },
  ];

  const campioni = [];
  for (let lato = 0; lato < 4; lato++) {
    const da = angoli[lato];
    const a = angoli[(lato + 1) % 4];
    for (let i = 0; i < CAMPIONI_PER_LATO; i++) {
      const t = i / CAMPIONI_PER_LATO;
      const sulBordo = { x: da.x + (a.x - da.x) * t, y: da.y + (a.y - da.y) * t };
      const interno = {
        x: sulBordo.x + versoInterno[lato].x * DISTANZA_BORDO_POLLICI,
        y: sulBordo.y + versoInterno[lato].y * DISTANZA_BORDO_POLLICI,
      };
      campioni.push({ sulBordo, zona: dentro(interno, zonaA) ? 1 : dentro(interno, zonaB) ? 2 : 0 });
    }
  }

  const n = campioni.length;
  if (campioni.every((c) => c.zona === 0)) return null;
  const zonaPrima = (i) => {
    let j = (i - 1 + n) % n;
    while (campioni[j].zona === 0 && j !== i) j = (j - 1 + n) % n;
    return campioni[j].zona;
  };
  const zonaDopo = (i) => {
    let j = (i + 1) % n;
    while (campioni[j].zona === 0 && j !== i) j = (j + 1) % n;
    return campioni[j].zona;
  };

  // Varchi: sequenze di campioni senza zona, con una zona da un lato e l'altra dall'altro.
  const varchi = [];
  const visitato = new Array(n).fill(false);
  for (let i = 0; i < n; i++) {
    if (campioni[i].zona !== 0 || visitato[i]) continue;
    let inizio = i;
    while (campioni[(inizio - 1 + n) % n].zona === 0) inizio = (inizio - 1 + n) % n;
    const indici = [];
    let k = inizio;
    while (campioni[k].zona === 0 && !visitato[k]) {
      visitato[k] = true;
      indici.push(k);
      k = (k + 1) % n;
    }
    const prima = zonaPrima(inizio);
    const dopo = zonaDopo(indici[indici.length - 1]);
    if ((prima === 1 && dopo === 2) || (prima === 2 && dopo === 1)) {
      varchi.push({ punto: campioni[indici[Math.floor(indici.length / 2)]].sulBordo, lunghezza: indici.length });
    }
  }
  varchi.sort((a, b) => b.lunghezza - a.lunghezza);

  if (varchi.length >= 2) {
    return { x1: varchi[0].punto.x, y1: varchi[0].punto.y, x2: varchi[1].punto.x, y2: varchi[1].punto.y };
  }
  const ca = centroide(zonaA);
  const cb = centroide(zonaB);
  if (Math.abs(cb.x - ca.x) >= Math.abs(cb.y - ca.y)) {
    return { x1: larghezza / 2, y1: 0, x2: larghezza / 2, y2: altezza };
  }
  return { x1: 0, y1: altezza / 2, x2: larghezza, y2: altezza / 2 };
}
