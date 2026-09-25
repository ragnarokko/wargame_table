import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TavoloContext = createContext(null);

const PX_PER_POLLICE = 14;
const MARGINE_STAGING_POLLICI = 12;

export function TavoloProvider({ children }) {
  const [dimensioni, setDimensioniState] = useState({ larghezza: 60, altezza: 44 });
  const [sfondo, setSfondo] = useState(null);

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
      pxPerPollice: PX_PER_POLLICE,
      tavoloPx,
      tavoloRect,
      campoGiocoPx,
      margineStagingPx,
      puntoNelTavolo,
    }),
    [dimensioni, setDimensioni, sfondo, tavoloPx, tavoloRect, campoGiocoPx, margineStagingPx, puntoNelTavolo],
  );

  return <TavoloContext.Provider value={value}>{children}</TavoloContext.Provider>;
}

export function useTavolo() {
  const ctx = useContext(TavoloContext);
  if (!ctx) throw new Error('useTavolo deve essere usato dentro TavoloProvider');
  return ctx;
}
