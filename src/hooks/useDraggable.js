import { useRef, useState } from 'react';

/**
 * Trascinamento generico via Pointer Events, relativo a un containerRef condiviso.
 * Mantiene l'offset tra il punto di presa e il centro dell'elemento, cosi'
 * l'elemento non "salta" sotto al cursore quando lo si afferra.
 */
export function useDraggable({ containerRef, posizione, onSposta }) {
  const [posizioneTemp, setPosizioneTemp] = useState(null);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });

  const puntoRelativo = (clientX, clientY) => {
    const rect = containerRef.current.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

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
