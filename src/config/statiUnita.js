// Stati che si possono assegnare a un'unità dal menu del tasto destro (vedi MenuContestuale): ognuno diventa un
// token sul campo (vedi TokenStati). `colore` è lo sfondo del token (chiaro, il testo è scuro). Tutti gli stati
// si tolgono da soli al cambio di turno (blu/rosso) o di round (EVENTO_CAMBIO_TURNO), tranne quelli `persistente`.
export const STATI_UNITA = [
  { id: 'avanzato', nome: 'Avanzato', colore: '#fbbf24' },
  { id: 'shock', nome: 'Shock', colore: '#c084fc', persistente: true },
  { id: 'fallback', nome: 'Fallback', colore: '#2dd4bf' },
  { id: 'shoot', nome: 'Shoot', colore: '#fb923c' },
  { id: 'fought', nome: 'Fought', colore: '#f87171' },
];

export const statoUnita = (id) => STATI_UNITA.find((s) => s.id === id);
