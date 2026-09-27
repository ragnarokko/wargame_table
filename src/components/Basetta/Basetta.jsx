import { useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { calcolaDimensioniBasettaPx } from '../../utils/basetta';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import {
  EVENTO_EVIDENZIA_UNITA,
  EVENTO_SELEZIONE_MULTIPLA,
  EVENTO_TRASCINAMENTO_GRUPPO,
  EVENTO_ROTAZIONE_GRUPPO,
} from '../../utils/selezioneEventi';
import BasettaTooltip from '../BasettaTooltip/BasettaTooltip';
import MisuraDistanza from '../MisuraDistanza/MisuraDistanza';
import styles from './Basetta.module.css';

const INCREMENTO_ROTAZIONE = 15;
const SOGLIA_CLICK_PX = 3;

const COLORE_SQUADRA = {
  blu: '#3b82f6',
  rosso: '#ef4444',
};

// Debounce condiviso tra tutte le istanze: passando da una basetta all'altra (stesso
// gruppo o adiacenti) l'"enter" della nuova annulla lo spegnimento in sospeso della
// precedente, evitando che l'evidenziazione lampeggi nel breve istante di passaggio.
let timeoutSpegniEvidenziaHover = null;

function Basetta({ istanza, template, containerRef, rotazioneArea = 0, zoom = 1 }) {
  const { pxPerPollice, puntoNelTavolo } = useTavolo();
  const { spostaIstanza, ruotaIstanza } = useTavoloState();
  const [hover, setHover] = useState(false);
  const [ctrlPremuto, setCtrlPremuto] = useState(false);
  const [posizioneTemp, setPosizioneTemp] = useState(null);
  const [selezionata, setSelezionata] = useState(false);
  const [selezioneGruppo, setSelezioneGruppo] = useState([]);
  const [evidenziata, setEvidenziata] = useState(false);
  // Persistito su istanza (non stato locale) così un salvataggio completo della partita può leggerlo.
  const rotazione = istanza.rotazione ?? 0;
  const [rotazioneFantasma, setRotazioneFantasma] = useState(0);
  const [offsetRotazioneGruppo, setOffsetRotazioneGruppo] = useState({ dx: 0, dy: 0 });
  const [rotazioneGruppoAttiva, setRotazioneGruppoAttiva] = useState(false);
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

  // Hover su un'unità nella lista eserciti: illumina tutte le basette con lo stesso templateId.
  useEffect(() => {
    const onEvidenzia = (e) => setEvidenziata(e.detail.templateId === istanza.templateId);
    window.addEventListener(EVENTO_EVIDENZIA_UNITA, onEvidenzia);
    return () => window.removeEventListener(EVENTO_EVIDENZIA_UNITA, onEvidenzia);
  }, [istanza.templateId]);

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
      const posizioneFinale = {
        x: nuovaPosizione.x + offsetRotazioneGruppo.dx,
        y: nuovaPosizione.y + offsetRotazioneGruppo.dy,
      };
      const zonaPartenza = istanza.zona;
      const zonaArrivo = puntoNelTavolo(posizioneFinale.x, posizioneFinale.y) ? 'tavolo' : 'staging';
      const distanza =
        zonaPartenza === 'tavolo' && zonaArrivo === 'tavolo'
          ? Math.hypot(posizioneFinale.x - istanza.x, posizioneFinale.y - istanza.y) / pxPerPollice
          : null;
      spostaIstanza(istanza.id, posizioneFinale.x, posizioneFinale.y, zonaArrivo, distanza);
    };
    window.addEventListener(EVENTO_TRASCINAMENTO_GRUPPO, onTrascinamentoGruppo);
    return () => window.removeEventListener(EVENTO_TRASCINAMENTO_GRUPPO, onTrascinamentoGruppo);
  }, [gruppoAttivo, istanza, pxPerPollice, puntoNelTavolo, spostaIstanza, offsetRotazioneGruppo]);

  // Riceve lo spostamento live dovuto alla rotazione di gruppo (Q/W su SelezioneMultipla) mentre
  // un trascinamento di gruppo è in corso: si somma alla posizione trascinata corrente per mostrare
  // la rotazione "sul posto" in tempo reale, senza toccare lo stato condiviso (che viene scritto solo
  // al rilascio del mouse, vedi onPointerUp/onTrascinamentoGruppo).
  useEffect(() => {
    const onRotazioneGruppo = (e) => {
      if (!gruppoAttivo) return;
      const offset = e.detail.offsets.find((o) => o.id === istanza.id);
      if (offset) {
        setOffsetRotazioneGruppo({ dx: offset.dx, dy: offset.dy });
        setRotazioneGruppoAttiva(true);
      }
    };
    window.addEventListener(EVENTO_ROTAZIONE_GRUPPO, onRotazioneGruppo);
    return () => window.removeEventListener(EVENTO_ROTAZIONE_GRUPPO, onRotazioneGruppo);
  }, [gruppoAttivo, istanza.id]);

  // Al termine del trascinamento (per qualunque via: rilascio, annullo con Esc, o l'evento di
  // gruppo che lo chiude) l'offset di rotazione live torna a zero: è già stato incorporato nella
  // posizione finale scritta sullo stato condiviso da chi ha gestito il rilascio.
  useEffect(() => {
    if (posizioneTemp === null) {
      setOffsetRotazioneGruppo({ dx: 0, dy: 0 });
      setRotazioneGruppoAttiva(false);
    }
  }, [posizioneTemp]);

  // Q/W ruotano la basetta selezionata attorno al proprio centro; disattivati durante la selezione multipla.
  useEffect(() => {
    if (!selezionata || gruppoAttivo) return undefined;
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        ruotaIstanza(istanza.id, (rotazione - INCREMENTO_ROTAZIONE + 360) % 360);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        ruotaIstanza(istanza.id, (rotazione + INCREMENTO_ROTAZIONE) % 360);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selezionata, gruppoAttivo, rotazione, ruotaIstanza, istanza.id]);

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
    puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea, zoom);

  const onPointerDown = (e) => {
    // Solo tasto sinistro: il destro è riservato al pan dell'intera area (vedi AreaLavoro),
    // e deve poter risalire (bubbling) senza che qui iniziamo un trascinamento/selezione.
    if (e.button !== 0) return;
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
    if (spostamento < SOGLIA_CLICK_PX && offsetRotazioneGruppo.dx === 0 && offsetRotazioneGruppo.dy === 0) {
      selezionaBasetta();
      return;
    }
    handleSposta({ x: finale.x + offsetRotazioneGruppo.dx, y: finale.y + offsetRotazioneGruppo.dy });

    if (gruppoAttivo) {
      const dx = finale.x - istanza.x;
      const dy = finale.y - istanza.y;
      window.dispatchEvent(
        new CustomEvent(EVENTO_TRASCINAMENTO_GRUPPO, { detail: { dx, dy, escludiId: istanza.id, fine: true } }),
      );
    }
  };

  const inTrascinamento = posizioneTemp !== null;
  const posizioneBase = posizioneTemp || { x: istanza.x, y: istanza.y };
  // La rotazione di gruppo live (Q/W durante un trascinamento di gruppo) si somma alla posizione
  // trascinata corrente, così la basetta ruota visivamente "sul posto" in tempo reale.
  const posizioneVisualizzata = {
    x: posizioneBase.x + offsetRotazioneGruppo.dx,
    y: posizioneBase.y + offsetRotazioneGruppo.dy,
  };
  const dimensionePx = calcolaDimensioniBasettaPx(template, pxPerPollice);

  const distanzaLive = inTrascinamento
    ? Math.hypot(posizioneVisualizzata.x - istanza.x, posizioneVisualizzata.y - istanza.y) / pxPerPollice
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
    '--colore-squadra': COLORE_SQUADRA[template.esercito] || 'transparent',
  };

  // Hover sulla basetta: evidenzia (via EVENTO_EVIDENZIA_UNITA) la voce corrispondente
  // nella lista laterale e le altre basette della stessa unità, speculare all'hover
  // sulla lista che già evidenzia le basette sul campo.
  const onMouseEnterBasetta = () => {
    clearTimeout(timeoutSpegniEvidenziaHover);
    setHover(true);
    window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: istanza.templateId } }));
  };

  const onMouseLeaveBasetta = () => {
    setHover(false);
    timeoutSpegniEvidenziaHover = setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: null } }));
    }, 60);
  };

  return (
    <>
      {inTrascinamento && (!gruppoAttivo || (isReferenzaGruppo && !rotazioneGruppoAttiva)) && (
        <MisuraDistanza
          origine={{ x: istanza.x, y: istanza.y }}
          destinazione={posizioneVisualizzata}
          dimensionePx={dimensionePx}
          forma={template.forma}
          colore={template.colore}
          pollici={distanzaLive}
          rotazione={gruppoAttivo ? rotazione : rotazioneFantasma}
        />
      )}
      <div
        ref={elementoRef}
        className={`${styles.basetta} ${selezionata ? styles.selezionata : ''} ${
          evidenziata ? styles.evidenziata : ''
        }`}
        style={style}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseEnter={onMouseEnterBasetta}
        onMouseLeave={onMouseLeaveBasetta}
        title="Trascina per spostare (Esc per annullare). Click per selezionare, Q/W per ruotare. Ctrl+hover per i dettagli."
      >
        <div className={styles.indicatoreFronte} />
        <span className={styles.nome}>{template.nome}</span>
        {hover && ctrlPremuto && <BasettaTooltip template={template} />}
      </div>
    </>
  );
}

export default Basetta;
