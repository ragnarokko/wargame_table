/**
 * Converte un punto in coordinate schermo (clientX/clientY) in coordinate locali
 * del container, tenendo conto di rotazione e zoom (CSS transform) applicati al
 * container stesso. Il centro del container resta fisso durante rotazione/zoom
 * (transform-origin di default è 'center'): si calcola l'offset del punto rispetto
 * al centro — letto da getBoundingClientRect, quindi valido anche con un pan (solo
 * traslazione) applicato — lo si riporta alla scala 1:1 dividendo per lo zoom, e si
 * applica la rotazione inversa per ottenere il punto nel sistema di riferimento
 * "non ruotato/non scalato" in cui vivono le posizioni di dominio (px a
 * PX_PER_POLLICE fisso, vedi TavoloContext).
 */
export function puntoRelativoRuotato(clientX, clientY, containerEl, rotazioneGradi, zoom = 1) {
  const rect = containerEl.getBoundingClientRect();
  const centroX = rect.left + rect.width / 2;
  const centroY = rect.top + rect.height / 2;

  const dx = (clientX - centroX) / zoom;
  const dy = (clientY - centroY) / zoom;

  const rad = (-rotazioneGradi * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: containerEl.offsetWidth / 2 + (dx * cos - dy * sin),
    y: containerEl.offsetHeight / 2 + (dx * sin + dy * cos),
  };
}
