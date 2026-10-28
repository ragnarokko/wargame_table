import { useEffect, useRef, useState } from 'react';
import { puntoRelativoRuotato } from '../utils/coordinate';
import { EVENTO_ANNULLA_INTERAZIONI } from '../utils/selezioneEventi';

/**
 * Trascinamento generico via Pointer Events, relativo a un containerRef condiviso.
 * Mantiene l'offset tra il punto di presa e il centro dell'elemento, cosi'
 * l'elemento non "salta" sotto al cursore quando lo si afferra. Tiene conto di
 * rotazione e zoom dell'area di lavoro (`rotazioneArea`, `zoom`, come `Basetta`).
 */
export function useDraggable({ containerRef, posizione, onSposta, rotazioneArea = 0, zoom = 1 }) {
  const [posizioneTemp, setPosizioneTemp] = useState(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });

  const puntoRelativo = (clientX, clientY) =>
    puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea, zoom);

  // Un gesto a due dita sull'area di lavoro annulla il trascinamento iniziato dal primo dito.
  useEffect(() => {
    const annulla = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setPosizioneTemp(null);
    };
    window.addEventListener(EVENTO_ANNULLA_INTERAZIONI, annulla);
    return () => window.removeEventListener(EVENTO_ANNULLA_INTERAZIONI, annulla);
  }, []);

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const punto = puntoRelativo(e.clientX, e.clientY);
    offsetRef.current = { dx: posizione.x - punto.x, dy: posizione.y - punto.y };
    draggingRef.current = true;
    setPosizioneTemp(posizione);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const punto = puntoRelativo(e.clientX, e.clientY);
    setPosizioneTemp({ x: punto.x + offsetRef.current.dx, y: punto.y + offsetRef.current.dy });
  };

  const onPointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const punto = puntoRelativo(e.clientX, e.clientY);
    const finale = { x: punto.x + offsetRef.current.dx, y: punto.y + offsetRef.current.dy };
    setPosizioneTemp(null);
    onSposta(finale);
  };

  return {
    posizioneVisualizzata: posizioneTemp || posizione,
    handlers: { onPointerDown, onPointerMove, onPointerUp },
    inTrascinamento: posizioneTemp !== null,
  };
}
