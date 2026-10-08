import { useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { calcolaDimensioniBasettaPx } from '../../utils/basetta';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import { polliciAPx } from '../../utils/scala';
import {
  EVENTO_EVIDENZIA_UNITA,
  EVENTO_FISSA_POPUP,
  EVENTO_MOSTRA_UNITA,
  EVENTO_SELEZIONE_MULTIPLA,
  EVENTO_TRASCINAMENTO_GRUPPO,
  EVENTO_ROTAZIONE_GRUPPO,
} from '../../utils/selezioneEventi';
import BasettaTooltip from '../BasettaTooltip/BasettaTooltip';
import MisuraDistanza from '../MisuraDistanza/MisuraDistanza';
import styles from './Basetta.module.css';

const INCREMENTO_ROTAZIONE = 15;
const SOGLIA_CLICK_PX = 3;
const INCREMENTO_FERITE = 1;
const AURA_RAPIDA_POLLICI = 9;
const PASSO_FRECCE_POLLICI = 0.25;
// Versore (x destra, y giù) a schermo per ogni freccia direzionale.
const DIREZIONI_FRECCE = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

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
  const { spostaIstanza, ruotaIstanza, impostaFeriteIstanza, impostaAuraIstanza } = useTavoloState();
  const [hover, setHover] = useState(false);
  const [ctrlPremuto, setCtrlPremuto] = useState(false);
  // Popup dei dettagli fissato con il tasto I: resta aperto (e diventa cliccabile, per le tendine delle
  // abilità) finché non si preme di nuovo I o Esc.
  const [popupFissato, setPopupFissato] = useState(false);
  const hoverRef = useRef(false);
  const popupFissatoRef = useRef(false);
  const [posizioneTemp, setPosizioneTemp] = useState(null);
  const [selezionata, setSelezionata] = useState(false);
  const [selezioneGruppo, setSelezioneGruppo] = useState([]);
  const [evidenziata, setEvidenziata] = useState(false);
  // Persistito su istanza (non stato locale) così un salvataggio completo della partita può leggerlo.
  const rotazione = istanza.rotazione ?? 0;
  // Ferite correnti: solo per basette con un W numerico valido (le basette generiche di libreria,
  // senza statistiche strutturate, non mostrano il contatore). Valore iniziale = W del template.
  const feriteMassime = Number(template.w);
  const haFerite = Number.isFinite(feriteMassime) && feriteMassime > 0;
  const ferite = istanza.ferite ?? feriteMassime;
  // Offset (in pollici) dell'aura attiva, 0 = nessuna. Cresce di 1" ad ogni Z, si riduce di 1" ad
  // ogni X (spegnendosi del tutto sotto 1").
  const auraOffsetPollici = istanza.auraOffset ?? 0;
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

  popupFissatoRef.current = popupFissato;

  // Tasto I: sopra una basetta fissa il suo popup; con un popup già fissato lo chiude (anche con Esc).
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'Escape') {
        setPopupFissato(false);
      } else if (e.key === 'i' || e.key === 'I') {
        if (popupFissatoRef.current) {
          setPopupFissato(false);
        } else if (hoverRef.current) {
          setPopupFissato(true);
          window.dispatchEvent(new CustomEvent(EVENTO_FISSA_POPUP, { detail: { istanzaId: istanza.id } }));
        }
      }
    };
    const onFissa = (e) => {
      if (e.detail.istanzaId !== istanza.id) setPopupFissato(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(EVENTO_FISSA_POPUP, onFissa);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(EVENTO_FISSA_POPUP, onFissa);
    };
  }, [istanza.id]);

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

  // +/- con la basetta selezionata (singola, non in gruppo): regolano le ferite correnti di 1,
  // senza scendere sotto 0 né superare il massimo (W del template). Tracciato per singola
  // istanza, quindi indipendente tra basette della stessa unità.
  useEffect(() => {
    if (!selezionata || gruppoAttivo || !haFerite) return undefined;
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === '+') {
        e.preventDefault();
        impostaFeriteIstanza(istanza.id, Math.min(feriteMassime, ferite + INCREMENTO_FERITE));
      } else if (e.key === '-') {
        e.preventDefault();
        impostaFeriteIstanza(istanza.id, Math.max(0, ferite - INCREMENTO_FERITE));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selezionata, gruppoAttivo, haFerite, ferite, feriteMassime, impostaFeriteIstanza, istanza.id]);

  // Z/X con la basetta selezionata (singola, non in gruppo): gestiscono l'aura. Z senza aura
  // attiva la crea a 1"; con l'aura già attiva la fa "crescere" di 1" in più rispetto all'offset
  // corrente. X riduce l'offset di 1", spegnendo l'aura quando scende sotto 1". C è una scorcia-
  // toia rapida: senza aura attiva la imposta direttamente a 9" (qualunque sia stata l'ultima via
  // usata, C o Z/X), con aura già attiva (a qualsiasi offset) la spegne del tutto.
  useEffect(() => {
    if (!selezionata || gruppoAttivo) return undefined;
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'z' || e.key === 'Z') {
        e.preventDefault();
        impostaAuraIstanza(istanza.id, auraOffsetPollici + 1);
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        impostaAuraIstanza(istanza.id, Math.max(0, auraOffsetPollici - 1));
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        impostaAuraIstanza(istanza.id, auraOffsetPollici > 0 ? 0 : AURA_RAPIDA_POLLICI);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selezionata, gruppoAttivo, auraOffsetPollici, impostaAuraIstanza, istanza.id]);

  // Frecce direzionali con la basetta selezionata (singola o in gruppo: ogni basetta selezionata
  // ascolta per conto suo e si sposta dello stesso passo, quindi il gruppo si muove compatto):
  // spostamento piccolo e preciso (PASSO_FRECCE_POLLICI) rispetto al trascinamento col mouse. La
  // direzione è quella sullo SCHERMO, quindi va riportata nel sistema di coordinate dell'area
  // (ruotato di rotazioneArea): "su" resta "su" a schermo anche con l'area ruotata con A/S.
  useEffect(() => {
    if (!selezionata) return undefined;
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.ctrlKey || e.altKey || e.metaKey || draggingRef.current) return;
      const direzioneSchermo = DIREZIONI_FRECCE[e.key];
      if (!direzioneSchermo) return;
      e.preventDefault(); // impedisce lo scroll nativo dell'area con le frecce
      const rad = (rotazioneArea * Math.PI) / 180;
      const passoPx = polliciAPx(PASSO_FRECCE_POLLICI, pxPerPollice);
      const arrotonda = (v) => Math.round(v * 1000) / 1000;
      const dx = arrotonda((direzioneSchermo.x * Math.cos(rad) + direzioneSchermo.y * Math.sin(rad)) * passoPx);
      const dy = arrotonda((-direzioneSchermo.x * Math.sin(rad) + direzioneSchermo.y * Math.cos(rad)) * passoPx);
      handleSposta({ x: istanza.x + dx, y: istanza.y + dy });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selezionata, rotazioneArea, pxPerPollice, istanza, puntoNelTavolo, spostaIstanza]);

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

  // Anello aura: stessa forma della basetta (cerchio per "tonda", ellisse/rettangolo arrotondato
  // per le altre), concentrico, con ogni lato "gonfiato" dell'offset corrente — segue posizione e
  // rotazione correnti della basetta perché usa le stesse posizioneVisualizzata/rotazione.
  const auraOffsetPx = polliciAPx(auraOffsetPollici, pxPerPollice);
  const auraStyle = auraOffsetPollici > 0 && {
    left: posizioneVisualizzata.x - (dimensionePx.larghezza / 2 + auraOffsetPx),
    top: posizioneVisualizzata.y - (dimensionePx.altezza / 2 + auraOffsetPx),
    width: dimensionePx.larghezza + 2 * auraOffsetPx,
    height: dimensionePx.altezza + 2 * auraOffsetPx,
    borderRadius: template.forma === 'rettangolare' ? 4 : '50%',
    transform: `rotate(${rotazione}deg)`,
  };

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
    // Il popup Ctrl+hover (z-index 200, vedi BasettaTooltip.module.css) è un discendente di
    // questa basetta: da solo non basta a farlo comparire sopra ALTRE basette/elementi scenici,
    // perché lo z-index di un figlio conta solo all'interno del contesto di stacking del proprio
    // genitore (qui creato da position+z-index). Serve quindi alzare anche lo z-index della
    // basetta stessa mentre il popup è visibile, oltre il massimo usato altrove (50, durante un
    // trascinamento), altrimenti il popup può restare "sotto" una basetta/elemento scenico
    // successivo nell'ordine del DOM che lo sovrappone sullo schermo.
    zIndex: inTrascinamento ? 50 : (hover && ctrlPremuto) || popupFissato ? 100 : 10,
    transform: `rotate(${rotazione}deg)`,
    '--colore-squadra': COLORE_SQUADRA[template.esercito] || 'transparent',
  };

  // Hover sulla basetta: evidenzia (via EVENTO_EVIDENZIA_UNITA) la voce corrispondente
  // nella lista laterale e le altre basette della stessa unità, speculare all'hover
  // sulla lista che già evidenzia le basette sul campo.
  const onMouseEnterBasetta = () => {
    clearTimeout(timeoutSpegniEvidenziaHover);
    hoverRef.current = true;
    setHover(true);
    window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: istanza.templateId } }));
  };

  const onMouseLeaveBasetta = () => {
    hoverRef.current = false;
    setHover(false);
    timeoutSpegniEvidenziaHover = setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENTO_EVIDENZIA_UNITA, { detail: { templateId: null } }));
    }, 60);
  };

  return (
    <>
      {auraStyle && <div className={styles.aura} style={auraStyle} />}
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
        onDoubleClick={() => {
          if (!template.esercito) return;
          window.dispatchEvent(
            new CustomEvent(EVENTO_MOSTRA_UNITA, { detail: { templateId: istanza.templateId, esercito: template.esercito } }),
          );
        }}
        title={
          "Trascina per spostare (Esc per annullare). Click per selezionare, frecce per spostare di poco, " +
          "Q/W per ruotare, +/- per le ferite, Z/X per l'aura, C per l'aura rapida da 9\". Ctrl+hover per i dettagli (I per tenerli aperti), doppio click per trovare l'unità nella lista."
        }
      >
        <div className={styles.indicatoreFronte} />
        <span className={styles.nome}>{template.nome}</span>
        {haFerite && (
          <span className={styles.ferite}>
            {ferite}/{feriteMassime}
          </span>
        )}
        {((hover && ctrlPremuto) || popupFissato) && (
          <BasettaTooltip template={template} rotazione={rotazione} interattivo={popupFissato} />
        )}
      </div>
    </>
  );
}

export default Basetta;
