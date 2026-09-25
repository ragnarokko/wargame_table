// Lista configurabile delle dimensioni di basette disponibili per la creazione unità.
// Per aggiungere una nuova dimensione basta aggiungere una voce all'array corrispondente:
// - tonde: { id univoco, diametroMm }
// - ovali: { id univoco, lungoMm (lato lungo), cortoMm (lato corto) }

export const DIMENSIONI_TONDE = [
  { id: 'tonda-25', diametroMm: 25 },
  { id: 'tonda-28_5', diametroMm: 28.5 },
  { id: 'tonda-32', diametroMm: 32 },
  { id: 'tonda-40', diametroMm: 40 },
  { id: 'tonda-50', diametroMm: 50 },
  { id: 'tonda-60', diametroMm: 60 },
  { id: 'tonda-80', diametroMm: 80 },
  { id: 'tonda-90', diametroMm: 90 },
  { id: 'tonda-100', diametroMm: 100 },
];

export const DIMENSIONI_OVALI = [
  { id: 'ovale-170x109', lungoMm: 170, cortoMm: 109 },
  { id: 'ovale-75x42', lungoMm: 75, cortoMm: 42 },
  { id: 'ovale-120x92', lungoMm: 120, cortoMm: 92 },
  { id: 'ovale-150x95', lungoMm: 150, cortoMm: 95 },
  { id: 'ovale-90x52_5', lungoMm: 90, cortoMm: 52.5 },
  { id: 'ovale-105x70', lungoMm: 105, cortoMm: 70 },
];

export function dimensioniPerForma(forma) {
  return forma === 'tonda' ? DIMENSIONI_TONDE : DIMENSIONI_OVALI;
}

export function trovaDimensione(forma, dimensioneId) {
  return dimensioniPerForma(forma).find((d) => d.id === dimensioneId);
}

export function etichettaDimensione(dimensione, forma) {
  if (!dimensione) return '';
  return forma === 'tonda' ? `⌀ ${dimensione.diametroMm} mm` : `${dimensione.lungoMm} × ${dimensione.cortoMm} mm`;
}
