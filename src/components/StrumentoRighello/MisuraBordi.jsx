import { useCallback, useEffect, useRef, useState } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import {
  coppiaBordiPiuVicina,
  distanzaConSegno,
  poligonoBasetta,
  puntoBordoPiuVicino,
  puntoBordoVerso,
} from '../../utils/geometriaBasette';
import styles from './StrumentoRighello.module.css';

// Misurazione tra bordi con il tasto Tab (tenuto premuto), come MisuraRapida (F) ma consapevole delle
// basette: se il punto di partenza è su una basetta la misura parte dal suo bordo, nella direzione del
// mouse; se il mouse è su un'altra basetta la misura finisce sul punto del suo bordo più vicino.
function MisuraBordi({ containerRef, rotazioneArea = 0, zoom = 1 }) {
  const { pxPerPollice } = useTavolo();
  const { basette } = useLibreria();
  const { istanze } = useTavoloState();
  const [stato, setStato] = useState(null); // { origine: punto, idBasettaOrigine, corrente: punto }
  const mousePosRef = useRef({ x: 0, y: 0 });
  const attivaRef = useRef(false);
  const poligoniRef = useRef([]);

  // Poligoni di tutte le basette sul campo, riletti solo quando cambiano istanze o template.
  useEffect(() => {
    poligoniRef.current = istanze
      .map((istanza) => {
        const template = basette.find((b) => b.id === istanza.templateId);
        return template ? { id: istanza.id, poligono: poligonoBasetta(istanza, template, pxPerPollice) } : null;
      })
      .filter(Boolean);
  }, [istanze, basette, pxPerPollice]);

  const puntoRelativo = useCallback(
    (clientX, clientY) => puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea, zoom),
    [containerRef, rotazioneArea, zoom],
  );

  useEffect(() => {
    const onPointerMove = (e) => {
      mousePosRef.current = { x: e.clientX, y: e.clientY };
      if (attivaRef.current) {
        const punto = puntoRelativo(e.clientX, e.clientY);
        setStato((s) => (s ? { ...s, corrente: punto } : s));
      }
    };
    window.addEventListener('pointermove', onPointerMove);
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [puntoRelativo]);

  useEffect(() => {
    const spegni = () => {
      attivaRef.current = false;
      setStato(null);
    };
    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      e.preventDefault(); // niente cambio di focus tra i pulsanti
      if (e.repeat || attivaRef.current) return;
      attivaRef.current = true;
      const punto = puntoRelativo(mousePosRef.current.x, mousePosRef.current.y);
      const sotto = poligoniRef.current.find(({ poligono }) => distanzaConSegno(punto.x, punto.y, poligono) <= 0);
      setStato({ origine: punto, idBasettaOrigine: sotto ? sotto.id : null, corrente: punto });
    };
    const onKeyUp = (e) => {
      if (e.key === 'Tab') spegni();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', spegni);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', spegni);
    };
  }, [puntoRelativo]);

  if (!stato) return null;

  const { corrente, idBasettaOrigine } = stato;
  const poligoni = poligoniRef.current;
  const origineBasetta = idBasettaOrigine ? poligoni.find((p) => p.id === idBasettaOrigine) : null;
  // Altra basetta sotto il mouse: la misura finisce sul suo bordo.
  const fine = poligoni.find(
    ({ id, poligono }) => id !== idBasettaOrigine && distanzaConSegno(corrente.x, corrente.y, poligono) <= 0,
  );

  let da = stato.origine;
  let a = corrente;
  if (origineBasetta && fine) {
    ({ da, a } = coppiaBordiPiuVicina(origineBasetta.poligono, fine.poligono));
  } else if (origineBasetta) {
    // Finché il mouse resta dentro la basetta di partenza non c'è nessuna misura.
    da = distanzaConSegno(corrente.x, corrente.y, origineBasetta.poligono) > 0
      ? puntoBordoVerso(corrente.x, corrente.y, origineBasetta.poligono)
      : corrente;
  } else if (fine) {
    a = puntoBordoPiuVicino(da.x, da.y, fine.poligono);
  }

  const pollici = Math.hypot(a.x - da.x, a.y - da.y) / pxPerPollice;

  return (
    <div className={styles.overlayPassivo}>
      <svg className={styles.lineaSvg}>
        <line x1={da.x} y1={da.y} x2={a.x} y2={a.y} className={styles.linea} />
        <circle cx={da.x} cy={da.y} r={3} className={styles.puntoBordo} />
        <circle cx={a.x} cy={a.y} r={3} className={styles.puntoBordo} />
      </svg>
      <div className={styles.etichetta} style={{ left: (da.x + a.x) / 2, top: (da.y + a.y) / 2 }}>
        {pollici.toFixed(1)}&quot;
      </div>
    </div>
  );
}

export default MisuraBordi;
