// Layout ufficiali dell'11a edizione (Event Companion), uno per ogni coppia di Force disposition e variante
// A/B/C. I file stanno in src/data/layouts/<ID>.json (generati da tools/converti-layout-rapidingress.mjs)
// e si caricano uno alla volta, solo quando servono.
const caricatori = import.meta.glob('../data/layouts/*.json', { import: 'default' });

const VARIANTI = { 1: 'A', 2: 'B', 3: 'C' };

// Id del layout (es. 'PF-TH-A') per due codici di disposizione e il numero di layout (1-3), o null se non
// esiste. L'ordine dei due giocatori non conta: il file è uno solo per coppia.
export function idLayout(codice1, codice2, numeroLayout) {
  const variante = VARIANTI[numeroLayout];
  if (!codice1 || !codice2 || !variante) return null;
  const [a, b] = [codice1.toUpperCase(), codice2.toUpperCase()];
  for (const id of [`${a}-${b}-${variante}`, `${b}-${a}-${variante}`]) {
    if (caricatori[`../data/layouts/${id}.json`]) return id;
  }
  return null;
}

const cache = new Map();

export function caricaLayout(id) {
  if (!cache.has(id)) cache.set(id, caricatori[`../data/layouts/${id}.json`]());
  return cache.get(id);
}
