import { useCallback, useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import { EVENTO_ANNULLA_INTERAZIONI } from '../../utils/selezioneEventi';
import Staging from '../Staging/Staging';
import Tavolo from '../Tavolo/Tavolo';
import LayoutTavolo from '../LayoutTavolo/LayoutTavolo';
import Basetta from '../Basetta/Basetta';
import ElementoScenico from '../ElementoScenico/ElementoScenico';
import StrumentoRighello from '../StrumentoRighello/StrumentoRighello';
import MisuraBordi from '../StrumentoRighello/MisuraBordi';
import MisuraRapida from '../StrumentoRighello/MisuraRapida';
import SelezioneMultipla from '../SelezioneMultipla/SelezioneMultipla';
import IndicatoriTavolo from '../IndicatoriTavolo/IndicatoriTavolo';
import styles from './AreaLavoro.module.css';

const INCREMENTO_ROTAZIONE_AREA = 90;
const FATTORE_ZOOM = 1.15;
const ZOOM_MIN = 0.15;
const ZOOM_MAX = 3;
// Spazio lasciato libero attorno al campo di gioco quando lo si adatta allo schermo.
const MARGINE_ADATTA_PX = 12;

const limitaZoom = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

function AreaLavoro({ righelloAttivo }) {
  const { campoGiocoPx } = useTavolo();
  const { istanze, elementiScenici } = useTavoloState();
  const { basette } = useLibreria();
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const [rotazioneArea, setRotazioneArea] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [inPan, setInPan] = useState(false);
  const [inGesto, setInGesto] = useState(false);
  // Finché non si zooma o si sposta a mano, il campo di gioco resta adattato allo spazio disponibile
  // (all'avvio, ridimensionando la finestra, aprendo/chiudendo i pannelli, ruotando l'area).
  const [adattaAuto, setAdattaAuto] = useState(true);
  const panAttivoRef = useRef(false);
  const panRef = useRef({ ultimoX: 0, ultimoY: 0 });
  const zoomStatoRef = useRef(zoom);
  const panStatoRef = useRef(pan);
  const campoRef = useRef(campoGiocoPx);
  zoomStatoRef.current = zoom;
  panStatoRef.current = pan;
  campoRef.current = campoGiocoPx;

  // Adatta il campo di gioco (ruotato) allo spazio del wrapper, centrato. Non lo ingrandisce oltre 1:1.
  // Il campo è centrato dal layout (margin:auto) quando sta nel wrapper, altrimenti parte dall'angolo in alto a
  // sinistra: il pan serve a riportarne il centro al centro del wrapper.
  const adatta = useCallback(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || wrapper.clientWidth <= 0 || wrapper.clientHeight <= 0) return;
    const ruotato = rotazioneArea % 180 !== 0;
    const larghezza = ruotato ? campoGiocoPx.altezza : campoGiocoPx.larghezza;
    const altezza = ruotato ? campoGiocoPx.larghezza : campoGiocoPx.altezza;
    const disponibileL = wrapper.clientWidth - 2 * MARGINE_ADATTA_PX;
    const disponibileA = wrapper.clientHeight - 2 * MARGINE_ADATTA_PX;
    setZoom(limitaZoom(Math.min(1, disponibileL / larghezza, disponibileA / altezza)));
    setPan({
      x: Math.min(0, (wrapper.clientWidth - campoGiocoPx.larghezza) / 2),
      y: Math.min(0, (wrapper.clientHeight - campoGiocoPx.altezza) / 2),
    });
  }, [campoGiocoPx, rotazioneArea]);

  const adattaRef = useRef(adatta);
  const adattaAutoRef = useRef(adattaAuto);
  adattaRef.current = adatta;
  adattaAutoRef.current = adattaAuto;

  useEffect(() => {
    if (adattaAuto) adatta();
  }, [adattaAuto, adatta]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || typeof ResizeObserver === 'undefined') return undefined;
    const osservatore = new ResizeObserver(() => {
      if (adattaAutoRef.current) adattaRef.current();
    });
    osservatore.observe(wrapper);
    return () => osservatore.disconnect();
  }, []);

  // A/S ruotano l'intera area di lavoro (tavolo + staging) di 90° per volta,
  // G/H la ingrandiscono/rimpiccioliscono (solo aspetto visivo: la scala di
  // dominio px↔pollici in TavoloContext resta fissa, vedi puntoRelativoRuotato).
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setRotazioneArea((r) => (r - INCREMENTO_ROTAZIONE_AREA + 360) % 360);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setRotazioneArea((r) => (r + INCREMENTO_ROTAZIONE_AREA) % 360);
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        setAdattaAuto(false);
        setZoom((z) => limitaZoom(z * FATTORE_ZOOM));
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setAdattaAuto(false);
        setZoom((z) => limitaZoom(z / FATTORE_ZOOM));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Pan con il tasto destro: il traslamento è l'ultima trasformazione applicata
  // (vedi transform sotto), quindi avviene nello spazio schermo del genitore e
  // il delta del mouse in px si somma 1:1 al pan, indipendente da zoom/rotazione.
  // Il tasto sinistro (drag basette, righello, selezione multipla) non è toccato:
  // quei componenti ignorano i pulsanti diversi dal sinistro (vedi loro onPointerDown).
  //
  // Ascoltato su window (non come prop React sul wrapper): un handler pointer* su un
  // ANTENATO dell'area interattiva fa sì che Chromium, durante un trascinamento con il
  // tasto sinistro su un discendente (basetta/righello/selezione), interpreti la
  // sequenza come un possibile gesto nativo e la cancelli a metà con un evento
  // "pointercancel" — anche se l'handler qui sopra ignora subito i pulsanti diversi dal
  // destro. Ascoltando su window (fuori dalla catena di antenati dei livelli interattivi)
  // il problema non si presenta, e non serve setPointerCapture: gli altri componenti
  // ignorano già il tasto destro, quindi nessuno lo cattura in esclusiva.
  useEffect(() => {
    const onPointerDown = (e) => {
      if (e.button !== 2) return;
      if (!wrapperRef.current?.contains(e.target)) return;
      e.preventDefault();
      panAttivoRef.current = true;
      panRef.current = { ultimoX: e.clientX, ultimoY: e.clientY };
      setAdattaAuto(false);
      setInPan(true);
    };
    const onPointerMove = (e) => {
      if (!panAttivoRef.current) return;
      const dx = e.clientX - panRef.current.ultimoX;
      const dy = e.clientY - panRef.current.ultimoY;
      panRef.current = { ultimoX: e.clientX, ultimoY: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    };
    const onPointerUp = () => {
      if (!panAttivoRef.current) return;
      panAttivoRef.current = false;
      setInPan(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  // Gesto a due dita (tablet): avvicinare/allontanare le dita = zoom, spostarle insieme = pan. Lo zoom tiene
  // fermo il punto del campo che sta sotto le dita. Un solo dito resta com'è (basette, selezione, righello).
  // Come per il pan, tutto su window: il secondo dito si ferma in fase di cattura, così non arriva a basette e
  // overlay (che si limitano a ignorare il tasto destro, non i tocchi aggiuntivi), mentre l'evento
  // EVENTO_ANNULLA_INTERAZIONI interrompe ciò che il primo dito aveva già iniziato.
  useEffect(() => {
    const tocchi = new Map(); // pointerId → { x, y } dei (massimo due) tocchi sul wrapper
    let gesto = null;

    const coppia = () => {
      const [a, b] = [...tocchi.values()];
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distanza: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) };
    };

    // Centro del campo di gioco senza trasformazioni, in coordinate schermo (vedi `adatta`).
    const centroCampo = () => {
      const wrapper = wrapperRef.current;
      const r = wrapper.getBoundingClientRect();
      return {
        x: r.left + wrapper.clientLeft + Math.max(campoRef.current.larghezza, wrapper.clientWidth) / 2,
        y: r.top + wrapper.clientTop + Math.max(campoRef.current.altezza, wrapper.clientHeight) / 2,
      };
    };

    const onDown = (e) => {
      if (e.pointerType !== 'touch' || !wrapperRef.current?.contains(e.target)) return;
      if (tocchi.size >= 2) {
        e.stopPropagation();
        return;
      }
      tocchi.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (tocchi.size < 2) return;
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent(EVENTO_ANNULLA_INTERAZIONI));
      gesto = { ...coppia(), zoom: zoomStatoRef.current, pan: panStatoRef.current, centro: centroCampo() };
      setAdattaAuto(false);
      setInGesto(true);
    };
    const onMove = (e) => {
      if (!tocchi.has(e.pointerId)) return;
      tocchi.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!gesto || tocchi.size < 2) return;
      const ora = coppia();
      const z1 = limitaZoom((gesto.zoom * ora.distanza) / gesto.distanza);
      const k = z1 / gesto.zoom;
      setZoom(z1);
      setPan({
        x: ora.x - gesto.centro.x - k * (gesto.x - gesto.centro.x - gesto.pan.x),
        y: ora.y - gesto.centro.y - k * (gesto.y - gesto.centro.y - gesto.pan.y),
      });
    };
    const onUp = (e) => {
      if (!tocchi.delete(e.pointerId)) return;
      if (gesto && tocchi.size < 2) {
        gesto = null;
        setInGesto(false);
      }
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div className={styles.area}>
      <div
        ref={wrapperRef}
        className={`${styles.wrapper} ${inPan ? styles.inPan : ''}`}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          ref={containerRef}
          className={styles.campoGioco}
          style={{
            width: campoGiocoPx.larghezza,
            height: campoGiocoPx.altezza,
            transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotazioneArea}deg) scale(${zoom})`,
            transition: inPan || inGesto ? 'none' : undefined,
          }}
        >
          <Staging />
          <Tavolo />
          <LayoutTavolo />

          <div className={styles.livelloInterattivo}>
            <SelezioneMultipla
              containerRef={containerRef}
              attivo={!righelloAttivo}
              rotazioneArea={rotazioneArea}
              zoom={zoom}
            />
            {elementiScenici.map((elemento) => (
              <ElementoScenico
                key={elemento.id}
                elemento={elemento}
                containerRef={containerRef}
                rotazioneArea={rotazioneArea}
                zoom={zoom}
              />
            ))}
            {istanze.map((istanza) => {
              const template = basette.find((b) => b.id === istanza.templateId);
              if (!template) return null;
              return (
                <Basetta
                  key={istanza.id}
                  istanza={istanza}
                  template={template}
                  containerRef={containerRef}
                  rotazioneArea={rotazioneArea}
                  zoom={zoom}
                />
              );
            })}
            <StrumentoRighello
              containerRef={containerRef}
              attivo={righelloAttivo}
              rotazioneArea={rotazioneArea}
              zoom={zoom}
            />
            <MisuraRapida containerRef={containerRef} rotazioneArea={rotazioneArea} zoom={zoom} />
            <MisuraBordi containerRef={containerRef} rotazioneArea={rotazioneArea} zoom={zoom} />
          </div>

          <IndicatoriTavolo />
        </div>
      </div>

      <div className={styles.strumenti}>
        <button
          type="button"
          onClick={() => setRotazioneArea((r) => (r - INCREMENTO_ROTAZIONE_AREA + 360) % 360)}
          title="Ruota l'area di 90° in senso antiorario (A)"
          aria-label="Ruota a sinistra"
        >
          ⟲
        </button>
        <button
          type="button"
          onClick={() => setRotazioneArea((r) => (r + INCREMENTO_ROTAZIONE_AREA) % 360)}
          title="Ruota l'area di 90° in senso orario (S)"
          aria-label="Ruota a destra"
        >
          ⟳
        </button>
        <button
          type="button"
          className={adattaAuto ? styles.attivo : undefined}
          onClick={() => {
            setAdattaAuto(true);
            adatta();
          }}
          title="Adatta il tavolo allo schermo"
          aria-label="Adatta allo schermo"
        >
          ⤢
        </button>
      </div>
    </div>
  );
}

export default AreaLavoro;
