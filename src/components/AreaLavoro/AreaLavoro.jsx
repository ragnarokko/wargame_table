import { useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import Staging from '../Staging/Staging';
import Tavolo from '../Tavolo/Tavolo';
import Basetta from '../Basetta/Basetta';
import ElementoScenico from '../ElementoScenico/ElementoScenico';
import StrumentoRighello from '../StrumentoRighello/StrumentoRighello';
import MisuraRapida from '../StrumentoRighello/MisuraRapida';
import SelezioneMultipla from '../SelezioneMultipla/SelezioneMultipla';
import IndicatoriTavolo from '../IndicatoriTavolo/IndicatoriTavolo';
import styles from './AreaLavoro.module.css';

const INCREMENTO_ROTAZIONE_AREA = 90;
const FATTORE_ZOOM = 1.15;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3;

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
  const panAttivoRef = useRef(false);
  const panRef = useRef({ ultimoX: 0, ultimoY: 0 });

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
        setZoom((z) => Math.min(ZOOM_MAX, z * FATTORE_ZOOM));
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setZoom((z) => Math.max(ZOOM_MIN, z / FATTORE_ZOOM));
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

  return (
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
          transition: inPan ? 'none' : undefined,
        }}
      >
        <Staging />
        <Tavolo />

        <div className={styles.livelloInterattivo}>
          <SelezioneMultipla
            containerRef={containerRef}
            attivo={!righelloAttivo}
            rotazioneArea={rotazioneArea}
            zoom={zoom}
          />
          {elementiScenici.map((elemento) => (
            <ElementoScenico key={elemento.id} elemento={elemento} containerRef={containerRef} />
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
        </div>

        <IndicatoriTavolo />
      </div>
    </div>
  );
}

export default AreaLavoro;
