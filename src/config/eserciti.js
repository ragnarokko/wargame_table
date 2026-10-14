// Eserciti disponibili per il modulo Creazione Esercito.
export const ESERCITI = [
  { id: 'blu', nome: 'Esercito Blu' },
  { id: 'rosso', nome: 'Esercito Rosso' },
];

// Colore dell'anello delle basette e delle zone di schieramento di ogni esercito.
export const COLORE_ESERCITO = {
  blu: '#3b82f6',
  rosso: '#ef4444',
};

export function nomeEsercito(id) {
  return ESERCITI.find((e) => e.id === id)?.nome || id;
}
