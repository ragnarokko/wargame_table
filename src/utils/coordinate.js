/**
 * Converte un punto in coordinate schermo (clientX/clientY) in coordinate locali
 * del container, tenendo conto della rotazione CSS applicata al container stesso.
 * Il centro del container resta fisso durante la rotazione: si calcola l'offset
 * del punto rispetto al centro e si applica la rotazione inversa per riportarlo
 * nel sistema di riferimento "non ruotato" in cui vivono le posizioni di dominio.
 */
export function puntoRelativoRuotato(clientX, clientY, containerEl, rotazioneGradi) {
  const rect = containerEl.getBoundingClientRect();
  const centroX = rect.left + rect.width / 2;
  const centroY = rect.top + rect.height / 2;

  const dx = clientX - centroX;
  const dy = clientY - centroY;

  const rad = (-rotazioneGradi * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    x: containerEl.offsetWidth / 2 + (dx * cos - dy * sin),
    y: containerEl.offsetHeight / 2 + (dx * sin + dy * cos),
  };
}
