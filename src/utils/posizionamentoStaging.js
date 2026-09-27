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
