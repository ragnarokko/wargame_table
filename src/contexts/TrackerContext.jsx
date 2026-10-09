import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DISPOSIZIONI, LIMITI_VP, MISSIONI_SECONDARIE, missioneSecondaria } from '../config/missioni';
import { generaId } from '../utils/id';
import { useIndicatori } from './IndicatoriContext';
import { useTavolo } from './TavoloContext';

const TrackerContext = createContext(null);

const CHIAVE_LOCALSTORAGE = 'tavolo-tracker';
const GIOCATORI = ['blu', 'rosso'];

const giocatoreIniziale = () => ({
  disposizione: '',
  // 'tattiche' (si pescano a caso o si scelgono a mano) o 'fisse' (due scelte all'inizio).
  tipoSecondarie: 'tattiche',
  fisse: [],
  // Punti primarie per round: { 1: 5, 2: 8 }.
  primaria: {},
  // Secondarie in gioco: [{ carta, modo: 'fissa' | 'tattica' }], senza limite (se ne possono pescare più per turno).
  attive: [],
  scartate: [],
  // Punti secondarie segnati: [{ id, round, carta, modo, vp }] (una voce per ogni segnatura).
  log: [],
});

export const TRACKER_INIZIALE = {
  fase: 'setup', // 'setup' | 'partita'
  attaccante: '',
  primo: '',
  round: 1,
  turnoDi: '',
  finita: false,
  giocatori: { blu: giocatoreIniziale(), rosso: giocatoreIniziale() },
};

const altro = (giocatore) => (giocatore === 'blu' ? 'rosso' : 'blu');

// Unisce uno stato letto da localStorage/salvataggio con quello iniziale, così campi mancanti o
// salvataggi di versioni precedenti non rompono nulla.
function unisciConIniziale(dati) {
  const base = TRACKER_INIZIALE;
  if (!dati || typeof dati !== 'object') return base;
  const giocatori = {};
  for (const g of GIOCATORI) {
    giocatori[g] = { ...giocatoreIniziale(), ...(dati.giocatori?.[g] ?? {}) };
    // "Manuali" non è più un tipo: le carte si scelgono a mano con "Scegli" in qualsiasi tipo.
    if (giocatori[g].tipoSecondarie !== 'fisse') giocatori[g].tipoSecondarie = 'tattiche';
  }
  return { ...base, ...dati, giocatori };
}

function caricaIniziale() {
  try {
    const grezzo = localStorage.getItem(CHIAVE_LOCALSTORAGE);
    return grezzo ? unisciConIniziale(JSON.parse(grezzo)) : TRACKER_INIZIALE;
  } catch {
    return TRACKER_INIZIALE;
  }
}

function pescaCasuale(giocatore) {
  const inUso = new Set(giocatore.attive.map((a) => a.carta));
  let disponibili = MISSIONI_SECONDARIE.filter((m) => !inUso.has(m.id) && !giocatore.scartate.includes(m.id));
  let scartate = giocatore.scartate;
  if (disponibili.length === 0) {
    // Mazzo finito: si rimescolano le scartate.
    disponibili = MISSIONI_SECONDARIE.filter((m) => !inUso.has(m.id));
    scartate = [];
  }
  if (disponibili.length === 0) return giocatore;
  const carta = disponibili[Math.floor(Math.random() * disponibili.length)];
  return { ...giocatore, scartate, attive: [...giocatore.attive, { carta: carta.id, modo: 'tattica' }] };
}

// Stato della partita tracciata: setup (disposizioni, tipo di secondarie, attaccante, primo turno),
// turni/round, punti delle primarie e delle secondarie per giocatore ('blu' | 'rosso'). Round e giocatore
// attivo sono riportati negli indicatori sul tavolo (Turno, Tocca a); lo stato è salvato in
// localStorage e nel salvataggio partita.
export function TrackerProvider({ children }) {
  const [stato, setStato] = useState(caricaIniziale);
  const { impostaIndicatore, impostaGiocatoreAttivo } = useIndicatori();
  const { impostaSelezioneLayout } = useTavolo();
  const statoRef = useRef(stato);
  statoRef.current = stato;

  useEffect(() => {
    try {
      localStorage.setItem(CHIAVE_LOCALSTORAGE, JSON.stringify(stato));
    } catch {
      // localStorage non disponibile: il tracker funziona comunque, ma non si ricorda.
    }
  }, [stato]);

  useEffect(() => {
    if (stato.fase !== 'partita') return;
    impostaIndicatore('turno', stato.round);
    impostaGiocatoreAttivo(stato.turnoDi);
  }, [stato.fase, stato.round, stato.turnoDi, impostaIndicatore, impostaGiocatoreAttivo]);

  const aggiornaGiocatore = useCallback((giocatore, modifica) => {
    setStato((prev) => ({
      ...prev,
      giocatori: { ...prev.giocatori, [giocatore]: modifica(prev.giocatori[giocatore]) },
    }));
  }, []);

  // Scelte entrambe le disposizioni, le riporta in "Force disposition" (immagine di layout sul tavolo);
  // restano modificabili da lì. Solo su azione dell'utente: caricare un salvataggio non tocca il tavolo.
  const impostaGiocatore = useCallback(
    (giocatore, patch) => {
      aggiornaGiocatore(giocatore, (g) => ({ ...g, ...patch }));
      if (!patch.disposizione) return;
      const disposizioni = { blu: statoRef.current.giocatori.blu.disposizione, rosso: statoRef.current.giocatori.rosso.disposizione };
      disposizioni[giocatore] = patch.disposizione;
      if (!disposizioni.blu || !disposizioni.rosso) return;
      const codice = (id) => DISPOSIZIONI.find((d) => d.id === id)?.codice ?? '';
      impostaSelezioneLayout({ giocatore1: codice(disposizioni.blu), giocatore2: codice(disposizioni.rosso) });
    },
    [aggiornaGiocatore, impostaSelezioneLayout],
  );

  const impostaCampo = useCallback((campo, valore) => setStato((prev) => ({ ...prev, [campo]: valore })), []);

  const avviaPartita = useCallback(() => {
    setStato((prev) => {
      const giocatori = {};
      for (const g of GIOCATORI) {
        // Le tattiche non si pescano da sole: si sceglie tra "Pesca" e "Scegli" nella scheda.
        const giocatore = { ...prev.giocatori[g], primaria: {}, attive: [], scartate: [], log: [] };
        if (giocatore.tipoSecondarie === 'fisse') {
          giocatore.attive = giocatore.fisse.map((carta) => ({ carta, modo: 'fissa' }));
        }
        giocatori[g] = giocatore;
      }
      return { ...prev, fase: 'partita', round: 1, turnoDi: prev.primo, finita: false, giocatori };
    });
  }, []);

  const nuovaPartita = useCallback(() => setStato(TRACKER_INIZIALE), []);

  const avanzaTurno = useCallback(() => {
    setStato((prev) => {
      if (prev.finita) return prev;
      if (prev.turnoDi === prev.primo) return { ...prev, turnoDi: altro(prev.primo) };
      if (prev.round < LIMITI_VP.round) return { ...prev, round: prev.round + 1, turnoDi: prev.primo };
      return { ...prev, finita: true };
    });
  }, []);

  const tornaIndietro = useCallback(() => {
    setStato((prev) => {
      if (prev.finita) return { ...prev, finita: false };
      if (prev.turnoDi !== prev.primo) return { ...prev, turnoDi: prev.primo };
      if (prev.round > 1) return { ...prev, round: prev.round - 1, turnoDi: altro(prev.primo) };
      return prev;
    });
  }, []);

  // Una sola voce di primaria per round: registrare di nuovo lo stesso round la sostituisce.
  const registraPrimaria = useCallback(
    (giocatore, round, vp) =>
      aggiornaGiocatore(giocatore, (g) => {
        const primaria = { ...g.primaria };
        if (vp > 0) primaria[round] = vp;
        else delete primaria[round];
        return { ...g, primaria };
      }),
    [aggiornaGiocatore],
  );

  const aggiungiVoceSecondaria = useCallback(
    (giocatore, { carta, modo, round, vp, scarta }) =>
      aggiornaGiocatore(giocatore, (g) => {
        const log = vp > 0 ? [...g.log, { id: generaId(), round, carta, modo, vp }] : g.log;
        if (!scarta) return { ...g, log };
        return {
          ...g,
          log,
          attive: g.attive.filter((a) => a.carta !== carta),
          scartate: [...g.scartate, carta],
        };
      }),
    [aggiornaGiocatore],
  );

  // Modifica i punti di una voce già segnata (tornando al suo round); 0 la toglie.
  const modificaVoceSecondaria = useCallback(
    (giocatore, idVoce, vp) =>
      aggiornaGiocatore(giocatore, (g) => ({
        ...g,
        log: vp > 0 ? g.log.map((v) => (v.id === idVoce ? { ...v, vp } : v)) : g.log.filter((v) => v.id !== idVoce),
      })),
    [aggiornaGiocatore],
  );

  const rimuoviVoceSecondaria = useCallback(
    (giocatore, idVoce) => aggiornaGiocatore(giocatore, (g) => ({ ...g, log: g.log.filter((v) => v.id !== idVoce) })),
    [aggiornaGiocatore],
  );

  // Scelta manuale di una secondaria (sempre disponibile, qualunque sia il tipo di secondarie).
  const attivaSecondaria = useCallback(
    (giocatore, carta) =>
      aggiornaGiocatore(giocatore, (g) => {
        if (g.attive.some((a) => a.carta === carta)) return g;
        const fissa = g.tipoSecondarie === 'fisse' && missioneSecondaria(carta)?.fissabile;
        return {
          ...g,
          scartate: g.scartate.filter((id) => id !== carta),
          attive: [...g.attive, { carta, modo: fissa ? 'fissa' : 'tattica' }],
        };
      }),
    [aggiornaGiocatore],
  );

  const scartaSecondaria = useCallback(
    (giocatore, carta) =>
      aggiornaGiocatore(giocatore, (g) => ({
        ...g,
        attive: g.attive.filter((a) => a.carta !== carta),
        scartate: g.attive.find((a) => a.carta === carta)?.modo === 'fissa' ? g.scartate : [...g.scartate, carta],
      })),
    [aggiornaGiocatore],
  );

  const pescaSecondaria = useCallback(
    (giocatore) => aggiornaGiocatore(giocatore, pescaCasuale),
    [aggiornaGiocatore],
  );

  const ripristinaTracker = useCallback((dati) => setStato(unisciConIniziale(dati)), []);

  const value = useMemo(
    () => ({
      stato,
      impostaGiocatore,
      impostaCampo,
      avviaPartita,
      nuovaPartita,
      avanzaTurno,
      tornaIndietro,
      registraPrimaria,
      aggiungiVoceSecondaria,
      modificaVoceSecondaria,
      rimuoviVoceSecondaria,
      attivaSecondaria,
      scartaSecondaria,
      pescaSecondaria,
      ripristinaTracker,
    }),
    [
      stato,
      impostaGiocatore,
      impostaCampo,
      avviaPartita,
      nuovaPartita,
      avanzaTurno,
      tornaIndietro,
      registraPrimaria,
      aggiungiVoceSecondaria,
      modificaVoceSecondaria,
      rimuoviVoceSecondaria,
      attivaSecondaria,
      scartaSecondaria,
      pescaSecondaria,
      ripristinaTracker,
    ],
  );

  return <TrackerContext.Provider value={value}>{children}</TrackerContext.Provider>;
}

export function useTracker() {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error('useTracker deve essere usato dentro TrackerProvider');
  return ctx;
}
