import { unitaPerFazione } from './csvUnitaImport';
import {
  abilitaEsteseUnita,
  abilitaUnitaTesto,
  datiPuntiUnita,
  modelliPredefiniti,
  puntiPerNumeroModelli,
} from './csvArmyBuilderImport';

// Dati per creare un'unità a partire da una riga di info.csv, con le stesse regole del form "Nuova unità"
// (UnitaForm): statistiche dal CSV, NOTE e abilità estese dall'army builder, numero di modelli predefinito
// (minimo della composizione) se non indicato, punti dal taglio che contiene il numero di modelli, proposti
// solo sul primo profilo di una scheda multi-profilo per non contarli due volte. Il colore lo sceglie chi chiama.
export function datiUnitaDaCsv(unitaCsv, numeroModelli) {
  const predefiniti = modelliPredefiniti(unitaCsv);
  const numero = Math.max(1, Math.round(Number(numeroModelli ?? predefiniti?.valore ?? 1) || 1));
  const stimaPunti = puntiPerNumeroModelli(datiPuntiUnita(unitaCsv), numero);
  const primoProfilo = unitaPerFazione(unitaCsv.fazione)
    .filter((u) => u.datasheetId === unitaCsv.datasheetId)
    .sort((a, b) => a.riga - b.riga)[0];
  const proponiPunti = Boolean(stimaPunti) && primoProfilo?.chiave === unitaCsv.chiave;
  return {
    nomeBase: unitaCsv.nome,
    baseSize: unitaCsv.baseSize,
    datasheetId: unitaCsv.datasheetId,
    numeroModelli: numero,
    punti: proponiPunti ? stimaPunti.punti : undefined,
    mov: unitaCsv.mov,
    res: unitaCsv.res,
    w: unitaCsv.w,
    ts: unitaCsv.ts,
    tsPiu: unitaCsv.tsPiu,
    oc: unitaCsv.oc,
    fnp: unitaCsv.fnp ?? '',
    note: [unitaCsv.note, abilitaUnitaTesto(unitaCsv)].filter(Boolean).join('\n'),
    abilitaEstese: abilitaEsteseUnita(unitaCsv),
  };
}
