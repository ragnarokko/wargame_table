// Spazio verticale occupato in cima all'area di staging dalla fascia degli indicatori
// (IndicatoriTavolo: parte da top:20px in IndicatoriTavolo.module.css ed è alta al massimo ~60px).
// Lo schieramento automatico delle unità in staging parte sotto questo limite, altrimenti le
// basette finirebbero sotto i riquadri degli indicatori (che stanno sopra e le coprirebbero).
// Va tenuto allineato al CSS se cambiano posizione/dimensioni degli indicatori.
export const ALTEZZA_FASCIA_INDICATORI_PX = 90;
