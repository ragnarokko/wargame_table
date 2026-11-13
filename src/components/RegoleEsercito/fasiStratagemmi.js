// Fasi e turni degli stratagemmi (colonne `fase` e `turno` di stratagemmi.csv, in inglese): servono al filtro per
// fase in cima al gruppo Stratagemmi e ai simboli accanto al nome di ogni stratagemma.

export const FASI = [
  { id: 'command', nome: 'Comando', simbolo: '📣' },
  { id: 'movement', nome: 'Movimento', simbolo: '🏃' },
  { id: 'shooting', nome: 'Tiro', simbolo: '🎯' },
  { id: 'charge', nome: 'Carica', simbolo: '⚡' },
  { id: 'fight', nome: 'Mischia', simbolo: '⚔️' },
];

// "Any phase": vale in tutte le fasi.
export const FASE_QUALSIASI = { id: 'any', nome: 'Qualsiasi fase', simbolo: '✱' };

const FASE_PER_ID = new Map([...FASI, FASE_QUALSIASI].map((f) => [f.id, f]));

// "Shooting or Fight phase" → [fase tiro, fase mischia]. Testo non riconosciuto → nessuna fase.
export function fasiStratagemma(testo) {
  return String(testo ?? '')
    .replace(/\s*phase$/i, '')
    .split(/\s+or\s+/i)
    .map((nome) => FASE_PER_ID.get(nome.trim().toLowerCase()))
    .filter(Boolean);
}

// Lo stratagemma si può usare nella fase scelta nel filtro? 'tutto' = nessun filtro; "Any phase" vale sempre.
export function valeInFase(stratagemma, idFase) {
  if (idFase === 'tutto') return true;
  const fasi = fasiStratagemma(stratagemma.fase);
  return fasi.some((f) => f.id === idFase || f.id === 'any');
}

// 'proprio' = turno del giocatore a cui appartiene l'esercito, 'avversario', 'qualsiasi'.
export function tipoTurno(testo) {
  const t = String(testo ?? '');
  if (/^your/i.test(t)) return 'proprio';
  if (/^opponent/i.test(t)) return 'avversario';
  if (/^either/i.test(t)) return 'qualsiasi';
  return null;
}
