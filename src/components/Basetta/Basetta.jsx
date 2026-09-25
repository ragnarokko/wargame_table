import { useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { calcolaDimensioniBasettaPx } from '../../utils/basetta';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import { EVENTO_SELEZIONE_MULTIPLA, EVENTO_TRASCINAMENTO_GRUPPO } from '../../utils/selezioneEventi';
import BasettaTooltip from '../BasettaTooltip/BasettaTooltip';
import MisuraDistanza from '../MisuraDistanza/MisuraDistanza';
import styles from './Basetta.module.css';

const INCREMENTO_ROTAZIONE = 15;
const SOGLIA_CLICK_PX = 3;

function Basetta({ istanza, template, containerRef, rotazioneArea = 0 }) {
  const { pxPerPollice, puntoNelTavolo } = useTavolo();
  const { spostaIstanza, rimuoviIstanza } = useTavoloState();
  const [hover, setHover] = useState(false);
  const [ctrlPremuto, setCtrlPremuto] = useState(false);
  const [posizioneTemp, setPosizioneTemp] = useState(null);
  const [selezionata, setSelezionata] = useState(false);
  const [selezioneGruppo, setSelezioneGruppo] = useState([]);
  const [rotazione, setRotazione] = useState(0);
  const [rotazioneFantasma, setRotazioneFantasma] = useState(0);
  const draggingRef = useRef(false);
  const offsetRef = useRef({ dx: 0, dy: 0 });
  const elementoRef = useRef(null);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Control') setCtrlPremuto(true);
    };
    const onKeyUp = (e) => {
      if (e.key === 'Control') setCtrlPremuto(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const inGruppo = selezioneGruppo.includes(istanza.id);
  const gruppoAttivo = inGruppo && selezioneGruppo.length > 1;
  const isReferenzaGruppo = gruppoAttivo && selezioneGruppo[0] === istanza.id;

  // Esc annulla il trascinamento in corso: la basetta (e l'eventuale gruppo) torna alla posizione iniziale.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && draggingRef.current) {
        draggingRef.current = false;
        setPosizioneTemp(null);
        if (gruppoAttivo) {
          window.dispatchEvent(
            new CustomEvent(EVENTO_TRASCINAMENTO_GRUPPO, { detail: { escludiId: istanza.id, annulla: true } }),
          );
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gruppoAttivo, istanza.id]);

  // Selezione (singola o multipla): sincronizzata tra tutte le basette via evento condiviso.
  useEffect(() => {
    const onSelezione = (e) => {
      const ids = e.detail.ids;
      setSelezioneGruppo(ids);
      setSelezionata(ids.includes(istanza.id));
    };
    window.addEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
    return () => window.removeEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
  }, [istanza.id]);

  // Riceve lo spostamento di gruppo quando un'altra basetta selezionata viene trascinata.
  useEffect(() => {
    const onTrascinamentoGruppo = (e) => {
      const { dx, dy, escludiId, fine, annulla } = e.detail;
      if (!gruppoAttivo || istanza.id === escludiId) return;

      if (annulla) {
        setPosizioneTemp(null);
        return;
      }

      const nuovaPosizione = { x: istanza.x + dx, y: istanza.y + dy };
      if (!fine) {
        setPosizioneTemp(nuovaPosizione);
        return;
      }

      setPosizioneTemp(null);
      const zonaPartenza = istanza.zona;
      const zonaArrivo = puntoNelTavolo(nuovaPosizione.x, nuovaPosizione.y) ? 'tavolo' : 'staging';
      const distanza =
        zonaPartenza === 'tavolo' && zonaArrivo === 'tavolo' ? Math.hypot(dx, dy) / pxPerPollice : null;
      spostaIstanza(istanza.id, nuovaPosizione.x, nuovaPosizione.y, zonaArrivo, distanza);
    };
    window.addEventListener(EVENTO_TRASCINAMENTO_GRUPPO, onTrascinamentoGruppo);
    return () => window.removeEventListener(EVENTO_TRASCINAMENTO_GRUPPO, onTrascinamentoGruppo);
  }, [gruppoAttivo, istanza, pxPerPollice, puntoNelTavolo, spostaIstanza]);

  // Q/E ruotano la basetta selezionata attorno al proprio centro; disattivati durante la selezione multipla.
  useEffect(() => {
    if (!selezionata || gruppoAttivo) return undefined;
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        setRotazione((r) => (r - INCREMENTO_ROTAZIONE + 360) % 360);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setRotazione((r) => (r + INCREMENTO_ROTAZIONE) % 360);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selezionata, gruppoAttivo]);

  const handleSposta = (puntoFinale) => {
    const zonaPartenza = istanza.zona;
    const zonaArrivo = puntoNelTavolo(puntoFinale.x, puntoFinale.y) ? 'tavolo' : 'staging';

    let distanza = null;
    if (zonaPartenza === 'tavolo' && zonaArrivo === 'tavolo') {
      const dx = puntoFinale.x - istanza.x;
      const dy = puntoFinale.y - istanza.y;
      distanza = Math.sqrt(dx * dx + dy * dy) / pxPerPollice;
    }

    spostaIstanza(istanza.id, puntoFinale.x, puntoFinale.y, zonaArrivo, distanza);
  };

  const puntoRelativo = (clientX, clientY) =>
    puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea);

  const onPointerDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const punto = puntoRelativo(e.clientX, e.clientY);
    offsetRef.current = { dx: istanza.x - punto.x, dy: istanza.y - punto.y };
    draggingRef.current = true;
    setPosizioneTemp({ x: istanza.x, y: istanza.y });
    setRotazioneFantasma(rotazione);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const punto = puntoRelativo(e.clientX, e.clientY);
    const nuovaPosizione = { x: punto.x + offsetRef.current.dx, y: punto.y + offsetRef.current.dy };
    setPosizioneTemp(nuovaPosizione);

    if (gruppoAttivo) {
      const dx = nuovaPosizione.x - istanza.x;
      const dy = nuovaPosizione.y - istanza.y;
      window.dispatchEvent(
        new CustomEvent(EVENTO_TRASCINAMENTO_GRUPPO, { detail: { dx, dy, escludiId: istanza.id, fine: false } }),
      );
    }
  };

  const selezionaBasetta = () => {
    // Un click (senza trascinamento) su una basetta già nel gruppo selezionato non lo scioglie.
    if (gruppoAttivo) return;
    setSelezionata(true);
    setSelezioneGruppo([istanza.id]);
    window.dispatchEvent(new CustomEvent(EVENTO_SELEZIONE_MULTIPLA, { detail: { ids: [istanza.id] } }));
  };

  const onPointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const punto = puntoRelativo(e.clientX, e.clientY);
    const finale = { x: punto.x + offsetRef.current.dx, y: punto.y + offsetRef.current.dy };
    setPosizioneTemp(null);

    const spostamento = Math.hypot(finale.x - istanza.x, finale.y - istanza.y);
    if (spostamento < SOGLIA_CLICK_PX) {
      selezionaBasetta();
      return;
    }
    handleSposta(finale);

    if (gruppoAttivo) {
      const dx = finale.x - istanza.x;
      const dy = finale.y - istanza.y;
      window.dispatchEvent(
        new CustomEvent(EVENTO_TRASCINAMENTO_GRUPPO, { detail: { dx, dy, escludiId: istanza.id, fine: true } }),
      );
    }
  };

  const inTrascinamento = posizioneTemp !== null;
  const posizioneVisualizzata = posizioneTemp || { x: istanza.x, y: istanza.y };
  const dimensionePx = calcolaDimensioniBasettaPx(template, pxPerPollice);

  const distanzaLive = inTrascinamento
    ? Math.sqrt((posizioneTemp.x - istanza.x) ** 2 + (posizioneTemp.y - istanza.y) ** 2) / pxPerPollice
    : 0;

  const style = {
    left: posizioneVisualizzata.x - dimensionePx.larghezza / 2,
    top: posizioneVisualizzata.y - dimensionePx.altezza / 2,
    width: dimensionePx.larghezza,
    height: dimensionePx.altezza,
    backgroundColor: template.colore,
    borderRadius: template.forma === 'rettangolare' ? 4 : '50%',
    cursor: inTrascinamento ? 'grabbing' : 'grab',
    zIndex: inTrascinamento ? 50 : 10,
    transform: `rotate(${rotazione}deg)`,
  };

  return (
    <>
      {inTrascinamento && (!gruppoAttivo || isReferenzaGruppo) && (
        <MisuraDistanza
          origine={{ x: istanza.x, y: istanza.y }}
          destinazione={posizioneTemp}
          dimensionePx={dimensionePx}
          forma={template.forma}
          colore={template.colore}
          pollici={distanzaLive}
          rotazione={gruppoAttivo ? rotazione : rotazioneFantasma}
        />
      )}
      <div
        ref={elementoRef}
        className={`${styles.basetta} ${selezionata ? styles.selezionata : ''}`}
        style={style}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDoubleClick={() => rimuoviIstanza(istanza.id)}
        title="Trascina per spostare (Esc per annullare). Click per selezionare, Q/E per ruotare. Ctrl+hover per i dettagli. Doppio click per rimuovere."
      >
        <div className={styles.indicatoreFronte} />
        <span className={styles.nome}>{template.nome}</span>
        {hover && ctrlPremuto && <BasettaTooltip template={template} />}
      </div>
    </>
  );
}

export default Basetta;
