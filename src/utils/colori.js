// Palette di colori assegnati automaticamente alle nuove unità.
export const PALETTE_UNITA = [
  '#e63946',
  '#457b9d',
  '#2a9d8f',
  '#e9c46a',
  '#f4a261',
  '#8338ec',
  '#3a86ff',
  '#06d6a0',
  '#ef476f',
  '#ffd166',
  '#118ab2',
  '#c9184a',
];

// Restituisce il primo colore della palette non ancora usato dalle unità dell'esercito indicato.
export function coloreDisponibile(esercito, unitaEsistenti) {
  const usati = new Set(unitaEsistenti.filter((u) => u.esercito === esercito).map((u) => u.colore));
  const libero = PALETTE_UNITA.find((c) => !usati.has(c));
  if (libero) return libero;
  const tinta = Math.floor(Math.random() * 360);
  return `hsl(${tinta}, 65%, 55%)`;
}
