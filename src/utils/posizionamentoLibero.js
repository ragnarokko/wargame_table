import { polliciAPx } from './scala';
import { calcolaDimensioniBasettaPx } from './basetta';

const DISTANZA_MINIMA_POLLICI = 1;
const PASSO_RICERCA_PX = 8;
const RAGGIO_MASSIMO_PX = 4000;

// Converte le istanze già presenti sul campo nei loro rettangoli di ingombro (px, relativi al
// containerRef), per il controllo di sovrapposizione in trovaPosizioneLibera.
export function rettangoliDaIstanze(istanze, templatesPerId, pxPerPollice) {
  return istanze.map((ist) => {
    const template = templatesPerId.get(ist.templateId);
    const dim = template ? calcolaDimensioniBasettaPx(template, pxPerPollice) : { larghezza: 0, altezza: 0 };
    return {
      left: ist.x - dim.larghezza / 2,
      right: ist.x + dim.larghezza / 2,
      top: ist.y - dim.altezza / 2,
      bottom: ist.y + dim.altezza / 2,
    };
  });
}

function sovrapposta(centro, dimensione, rettangoliEsistenti, distanzaMinima) {
  const rett = {
    left: centro.x - dimensione.larghezza / 2 - distanzaMinima,
    right: centro.x + dimensione.larghezza / 2 + distanzaMinima,
    top: centro.y - dimensione.altezza / 2 - distanzaMinima,
    bottom: centro.y + dimensione.altezza / 2 + distanzaMinima,
  };
  return rettangoliEsistenti.some(
    (r) => rett.left < r.right && rett.right > r.left && rett.top < r.bottom && rett.bottom > r.top,
  );
}

// Cerca la posizione libera più vicina al punto proposto (centro.x, centro.y) che rispetti una
// distanza minima (in pollici, centro-centro tramite un buffer sui rettangoli di ingombro) da un
// elenco di rettangoli già occupati. Se il punto proposto è già libero lo restituisce invariato,
// altrimenti esplora a spirale (cerchi concentrici crescenti) attorno ad esso finché non trova un
// punto libero: essendo i raggi crescenti, il primo trovato è il più vicino.
export function trovaPosizioneLibera(
  centro,
  dimensione,
  rettangoliEsistenti,
  pxPerPollice,
  distanzaMinimaPollici = DISTANZA_MINIMA_POLLICI,
) {
  const distanzaMinima = polliciAPx(distanzaMinimaPollici, pxPerPollice);

  if (!sovrapposta(centro, dimensione, rettangoliEsistenti, distanzaMinima)) return centro;

  for (let raggio = PASSO_RICERCA_PX; raggio <= RAGGIO_MASSIMO_PX; raggio += PASSO_RICERCA_PX) {
    const numeroPunti = Math.max(8, Math.ceil((2 * Math.PI * raggio) / PASSO_RICERCA_PX));
    for (let i = 0; i < numeroPunti; i++) {
      const angolo = (2 * Math.PI * i) / numeroPunti;
      const candidato = {
        x: centro.x + raggio * Math.cos(angolo),
        y: centro.y + raggio * Math.sin(angolo),
      };
      if (!sovrapposta(candidato, dimensione, rettangoliEsistenti, distanzaMinima)) return candidato;
    }
  }

  return centro;
}
