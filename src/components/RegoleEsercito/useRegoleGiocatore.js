import { useEffect, useMemo } from 'react';
import { DISPOSIZIONI } from '../../config/missioni';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useRegoleEsercito } from '../../contexts/RegoleEsercitoContext';
import { codiceFazionePerDatasheetId, useVersioneDatiCsv } from '../CreazioneEsercito/csvUnitaImport';
import {
  caricaDatiRegoleSeNecessario,
  distaccamentiFazione,
  elencoFazioniRegole,
  useVersioneDatiRegole,
} from './csvRegoleEsercito';

// Fazione ricavata dalle unità create di un esercito: quella con più unità (a pari merito, la prima trovata).
export function fazioneDalleUnita(basette, esercito) {
  const conteggio = new Map();
  for (const b of basette) {
    if (b.esercito !== esercito) continue;
    const codice = codiceFazionePerDatasheetId(b.datasheetId);
    if (codice) conteggio.set(codice, (conteggio.get(codice) ?? 0) + 1);
  }
  return [...conteggio].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
}

// Fazione di un esercito (Blu/Rosso) per le regole: quella scelta a mano nel pannello Eserciti e, se non ce n'è,
// la proposta dalle unità create (quella con più unità). `dalleUnita` è la proposta, `automatica` dice se la
// fazione in uso è questa. Restituisce '' se i dati non conoscono la fazione.
export function useFazioneEsercito(esercitoId) {
  const { basette } = useLibreria();
  const { stato } = useRegoleEsercito();
  const versioneUnita = useVersioneDatiCsv();
  const versioneRegole = useVersioneDatiRegole();

  useEffect(() => {
    caricaDatiRegoleSeNecessario().catch(() => {});
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dalleUnita = useMemo(() => fazioneDalleUnita(basette, esercitoId), [basette, esercitoId, versioneUnita]);
  const codice = stato[esercitoId].fazione || dalleUnita;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const conosciuta = useMemo(() => elencoFazioniRegole().some((f) => f.codice === codice), [codice, versioneRegole]);
  return {
    codice: conosciuta ? codice : '',
    dalleUnita,
    automatica: !stato[esercitoId].fazione && Boolean(dalleUnita) && conosciuta,
  };
}

// Disposizioni di forze (id di DISPOSIZIONI) possibili per un giocatore, secondo i distaccamenti scelti nel
// pannello Eserciti: l'unione delle disposizioni dei distaccamenti scelti della sua fazione. `null` = nessun
// vincolo (nessun distaccamento scelto).
export function useDisposizioniConsentite(giocatore) {
  const { stato } = useRegoleEsercito();
  const { codice } = useFazioneEsercito(giocatore);
  const versioneRegole = useVersioneDatiRegole();
  const scelti = stato[giocatore].distaccamenti;

  return useMemo(() => {
    const dellaFazione = distaccamentiFazione(codice).filter((d) => scelti.includes(d.id));
    if (dellaFazione.length === 0) return null;
    const nomi = new Set(dellaFazione.map((d) => d.disposizione.trim().toLowerCase()));
    return new Set(DISPOSIZIONI.filter((d) => nomi.has(d.nome.toLowerCase())).map((d) => d.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codice, scelti, versioneRegole]);
}
