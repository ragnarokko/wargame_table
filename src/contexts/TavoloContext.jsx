import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TavoloContext = createContext(null);

const PX_PER_POLLICE = 14;
const MARGINE_STAGING_POLLICI = 14;
const CHIAVE_QUOTE = 'tavolo-mostra-quote';
const CHIAVE_CENTRO = 'tavolo-mostra-centro';

// Quote e icone di visibilità del layout sul tavolo: visibili salvo scelta contraria (tasto V), ricordata nel browser.
function leggiMostraQuote() {
  try {
    return localStorage.getItem(CHIAVE_QUOTE) !== 'no';
  } catch {
    return true;
  }
}

// Cerchi di 3" e 6" attorno al centro del tavolo (missione Centre Ground): spenti salvo scelta contraria, ricordata nel browser.
function leggiMostraCentro() {
  try {
    return localStorage.getItem(CHIAVE_CENTRO) === 'si';
  } catch {
    return false;
  }
}

export function TavoloProvider({ children }) {
  const [dimensioni, setDimensioniState] = useState({ larghezza: 60, altezza: 44 });
  const [sfondo, setSfondo] = useState(null);
  // Scelta di "Force disposition" (codici delle due disposizioni e numero di layout): vive qui, e non
  // dentro SelettoreLayout, perché la imposta anche il tracker di partita (vedi TrackerContext).
  const [selezioneLayout, setSelezioneLayout] = useState({ giocatore1: '', giocatore2: '', numeroLayout: '1' });

  const [mostraQuote, setMostraQuote] = useState(leggiMostraQuote);

  const alternaQuote = useCallback(() => {
    setMostraQuote((prev) => {
      try {
        localStorage.setItem(CHIAVE_QUOTE, prev ? 'no' : 'si');
      } catch {
        // localStorage non disponibile: la scelta vale solo per questa sessione.
      }
      return !prev;
    });
  }, []);

  const [mostraCentro, setMostraCentro] = useState(leggiMostraCentro);

  const alternaCentro = useCallback(() => {
    setMostraCentro((prev) => {
      try {
        localStorage.setItem(CHIAVE_CENTRO, prev ? 'no' : 'si');
      } catch {
        // localStorage non disponibile: la scelta vale solo per questa sessione.
      }
      return !prev;
    });
  }, []);

  const impostaSelezioneLayout = useCallback((patch) => {
    setSelezioneLayout((prev) => ({ ...prev, ...patch }));
  }, []);

  const setDimensioni = useCallback((larghezza, altezza) => {
    setDimensioniState({
      larghezza: Math.max(1, Number(larghezza) || 1),
      altezza: Math.max(1, Number(altezza) || 1),
    });
  }, []);

  const tavoloPx = useMemo(
    () => ({
      larghezza: dimensioni.larghezza * PX_PER_POLLICE,
      altezza: dimensioni.altezza * PX_PER_POLLICE,
    }),
    [dimensioni],
  );

  const margineStagingPx = MARGINE_STAGING_POLLICI * PX_PER_POLLICE;

  const tavoloRect = useMemo(
    () => ({
      left: margineStagingPx,
      top: margineStagingPx,
      width: tavoloPx.larghezza,
      height: tavoloPx.altezza,
    }),
    [margineStagingPx, tavoloPx],
  );

  const campoGiocoPx = useMemo(
    () => ({
      larghezza: tavoloPx.larghezza + margineStagingPx * 2,
      altezza: tavoloPx.altezza + margineStagingPx * 2,
    }),
    [tavoloPx, margineStagingPx],
  );

  const puntoNelTavolo = useCallback(
    (x, y) =>
      x >= tavoloRect.left &&
      x <= tavoloRect.left + tavoloRect.width &&
      y >= tavoloRect.top &&
      y <= tavoloRect.top + tavoloRect.height,
    [tavoloRect],
  );

  const value = useMemo(
    () => ({
      dimensioni,
      setDimensioni,
      sfondo,
      setSfondo,
      selezioneLayout,
      impostaSelezioneLayout,
      mostraQuote,
      alternaQuote,
      mostraCentro,
      alternaCentro,
      pxPerPollice: PX_PER_POLLICE,
      tavoloPx,
      tavoloRect,
      campoGiocoPx,
      margineStagingPx,
      puntoNelTavolo,
    }),
    [
      dimensioni,
      setDimensioni,
      sfondo,
      selezioneLayout,
      impostaSelezioneLayout,
      mostraQuote,
      alternaQuote,
      mostraCentro,
      alternaCentro,
      tavoloPx,
      tavoloRect,
      campoGiocoPx,
      margineStagingPx,
      puntoNelTavolo,
    ],
  );

  return <TavoloContext.Provider value={value}>{children}</TavoloContext.Provider>;
}

export function useTavolo() {
  const ctx = useContext(TavoloContext);
  if (!ctx) throw new Error('useTavolo deve essere usato dentro TavoloProvider');
  return ctx;
}
