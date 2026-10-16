import { polliciAPx } from './scala';
import { calcolaDimensioniBasettaPx } from './basetta';

const DISTANZA_INTERNA_POLLICI = 1;
const DISTANZA_MINIMA_UNITA_POLLICI = 2;
const PASSO_RICERCA_PX = 10;
const MARGINE_BORDO_POLLICI = 3;

// Calcola le posizioni (in px, relative al containerRef) per allineare su un'unica fila
// i modelli di una nuova unità in staging: 1 pollice tra i centri di basette adiacenti,
// l'intera fila ad almeno 2 pollici da basette di altre unità già presenti in staging, e ad
// almeno 3 pollici dal bordo dell'area di staging (areaStaging).
const MARGINE_ZONA_POLLICI = 1;

// Zone di staging (rettangoli in px, in ordine di preferenza) in cui schierare un esercito:
// il Rosso sta sopra il tavolo e, se non basta, ai lati nella metà alta; il Blu sotto il tavolo e,
// se non basta, ai lati nella metà bassa. La fascia in alto sotto gli indicatori (`altezzaFascia`) è esclusa.
// Restituisce { preferite, riserva }: la riserva (il resto dello staging, sempre fuori dal tavolo) si usa solo
// quando le zone preferite sono piene.
export function zoneStagingEsercito(esercitoId, { campoGiocoPx, tavoloRect, altezzaFascia }) {
  const tavoloDestra = tavoloRect.left + tavoloRect.width;
  const tavoloSotto = tavoloRect.top + tavoloRect.height;
  const meta = tavoloRect.top + tavoloRect.height / 2;
  const sinistra = (top, bottom) => ({ left: 0, top, width: tavoloRect.left, height: bottom - top });
  const destra = (top, bottom) => ({
    left: tavoloDestra,
    top,
    width: campoGiocoPx.larghezza - tavoloDestra,
    height: bottom - top,
  });
  const sopra = { left: 0, top: altezzaFascia, width: campoGiocoPx.larghezza, height: tavoloRect.top - altezzaFascia };
  const sotto = {
    left: 0,
    top: tavoloSotto,
    width: campoGiocoPx.larghezza,
    height: campoGiocoPx.altezza - tavoloSotto,
  };
  if (esercitoId === 'blu') {
    return {
      preferite: [sotto, sinistra(meta, tavoloSotto), destra(meta, tavoloSotto)],
      riserva: [sinistra(tavoloRect.top, meta), destra(tavoloRect.top, meta), sopra],
    };
  }
  return {
    preferite: [sopra, sinistra(tavoloRect.top, meta), destra(tavoloRect.top, meta)],
    riserva: [sinistra(meta, tavoloSotto), destra(meta, tavoloSotto), sotto],
  };
}

// Come calcolaPosizioniUnitaStaging, ma l'unità va dentro la prima delle `zone` (rettangoli in px, in ordine
// di preferenza) in cui trova posto: se la fila è più larga della zona va a capo su più righe. Cerca prima con
// 2" di distanza dalle altre unità, poi con meno, e solo dopo nelle `zoneRiserva`; se non c'è posto da nessuna
// parte ripiega sul calcolo classico su `areaStaging`.
export function calcolaPosizioniUnitaInZone({
  template,
  numeroModelli,
  istanzeStaging,
  templatesPerId,
  pxPerPollice,
  zone,
  zoneRiserva = [],
  areaStaging,
}) {
  const dim = calcolaDimensioniBasettaPx(template, pxPerPollice);
  const passoOrizzontale = polliciAPx(DISTANZA_INTERNA_POLLICI, pxPerPollice);
  const passoVerticale = Math.max(passoOrizzontale, dim.altezza);
  const margine = polliciAPx(MARGINE_ZONA_POLLICI, pxPerPollice);
  const esistenti = istanzeStaging.map((ist) => {
    const t = templatesPerId.get(ist.templateId);
    const d = t ? calcolaDimensioniBasettaPx(t, pxPerPollice) : { larghezza: 0, altezza: 0 };
    return {
      left: ist.x - d.larghezza / 2,
      right: ist.x + d.larghezza / 2,
      top: ist.y - d.altezza / 2,
      bottom: ist.y + d.altezza / 2,
    };
  });

  const tentativi = [
    ...[DISTANZA_MINIMA_UNITA_POLLICI, 0.5].map((d) => ({ distanzaPollici: d, zoneTentativo: zone })),
    ...[DISTANZA_MINIMA_UNITA_POLLICI, 0.5].map((d) => ({ distanzaPollici: d, zoneTentativo: zoneRiserva })),
  ];
  for (const { distanzaPollici, zoneTentativo } of tentativi) {
    const distanza = polliciAPx(distanzaPollici, pxPerPollice);
    for (const zona of zoneTentativo) {
      const larghezzaUtile = zona.width - 2 * margine - dim.larghezza;
      if (larghezzaUtile < 0) continue;
      const colonne = Math.max(1, Math.min(numeroModelli, Math.floor(larghezzaUtile / passoOrizzontale) + 1));
      const righe = Math.ceil(numeroModelli / colonne);
      const larghezzaBlocco = dim.larghezza + (colonne - 1) * passoOrizzontale;
      const altezzaBlocco = dim.altezza + (righe - 1) * passoVerticale;
      const maxLeft = zona.left + zona.width - margine - larghezzaBlocco;
      const maxTop = zona.top + zona.height - margine - altezzaBlocco;
      for (let top = zona.top + margine; top <= maxTop; top += PASSO_RICERCA_PX) {
        for (let left = zona.left + margine; left <= maxLeft; left += PASSO_RICERCA_PX) {
          const ingombro = {
            left: left - distanza,
            right: left + larghezzaBlocco + distanza,
            top: top - distanza,
            bottom: top + altezzaBlocco + distanza,
          };
          const occupato = esistenti.some(
            (r) => ingombro.left < r.right && ingombro.right > r.left && ingombro.top < r.bottom && ingombro.bottom > r.top,
          );
          if (occupato) continue;
          return Array.from({ length: numeroModelli }, (_, i) => ({
            x: left + dim.larghezza / 2 + (i % colonne) * passoOrizzontale,
            y: top + dim.altezza / 2 + Math.floor(i / colonne) * passoVerticale,
          }));
        }
      }
    }
  }

  return calcolaPosizioniUnitaStaging({
    template,
    numeroModelli,
    istanzeStaging,
    templatesPerId,
    pxPerPollice,
    areaStaging,
  });
}

export function calcolaPosizioniUnitaStaging({
  template,
  numeroModelli,
  istanzeStaging,
  templatesPerId,
  pxPerPollice,
  areaStaging,
}) {
  const dimensioneBasetta = calcolaDimensioniBasettaPx(template, pxPerPollice);
  const passoInterno = polliciAPx(DISTANZA_INTERNA_POLLICI, pxPerPollice);
  const distanzaMinima = polliciAPx(DISTANZA_MINIMA_UNITA_POLLICI, pxPerPollice);
  const margine = polliciAPx(MARGINE_BORDO_POLLICI, pxPerPollice);

  const larghezzaFila = dimensioneBasetta.larghezza + Math.max(0, numeroModelli - 1) * passoInterno;
  const altezzaFila = dimensioneBasetta.altezza;

  const rettangoliEsistenti = istanzeStaging.map((ist) => {
    const t = templatesPerId.get(ist.templateId);
    const dim = t ? calcolaDimensioniBasettaPx(t, pxPerPollice) : { larghezza: 0, altezza: 0 };
    return {
      left: ist.x - dim.larghezza / 2,
      right: ist.x + dim.larghezza / 2,
      top: ist.y - dim.altezza / 2,
      bottom: ist.y + dim.altezza / 2,
    };
  });

  const sovrappostaConEsistenti = (left, top) => {
    const rett = {
      left: left - distanzaMinima,
      right: left + larghezzaFila + distanzaMinima,
      top: top - distanzaMinima,
      bottom: top + altezzaFila + distanzaMinima,
    };
    return rettangoliEsistenti.some(
      (r) => rett.left < r.right && rett.right > r.left && rett.top < r.bottom && rett.bottom > r.top,
    );
  };

  // Se la fila è troppo larga per stare entro il margine anche sul lato destro, si preferisce
  // comunque mantenere il margine sinistro (caso limite: unità enormi in un'area di staging stretta).
  const left = Math.min(areaStaging.left + margine, areaStaging.left + areaStaging.width - margine - larghezzaFila);
  let top = areaStaging.top + margine;
  while (sovrappostaConEsistenti(left, top)) {
    top += PASSO_RICERCA_PX;
  }

  const centroY = top + altezzaFila / 2;
  const posizioni = [];
  for (let i = 0; i < numeroModelli; i++) {
    posizioni.push({
      x: left + dimensioneBasetta.larghezza / 2 + i * passoInterno,
      y: centroY,
    });
  }
  return posizioni;
}
