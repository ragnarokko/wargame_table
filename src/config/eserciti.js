// Eserciti disponibili per il modulo Creazione Esercito.
export const ESERCITI = [
  { id: 'blu', nome: 'Esercito Blu' },
  { id: 'rosso', nome: 'Esercito Rosso' },
];

export function nomeEsercito(id) {
  return ESERCITI.find((e) => e.id === id)?.nome || id;
}
