import { useCallback, useEffect, useRef, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import { calcolaDimensioniBasettaPx } from '../../utils/basetta';
import { polliciAPx } from '../../utils/scala';
import { puntoRelativoRuotato } from '../../utils/coordinate';
import {
  EVENTO_SELEZIONE_MULTIPLA,
  EVENTO_TRASCINAMENTO_GRUPPO,
  EVENTO_ROTAZIONE_GRUPPO,
} from '../../utils/selezioneEventi';
import MisuraDistanza from '../MisuraDistanza/MisuraDistanza';
import { useEliminaSelezione } from './useEliminaSelezione';
import styles from './SelezioneMultipla.module.css';

const SOGLIA_TRASCINAMENTO_PX = 3;
const DISTANZA_MINIMA_POLLICI = 1;
const INCREMENTO_ROTAZIONE_GRUPPO = 15;

// Ruota un punto attorno a un centro di un certo angolo (in gradi, positivo = orario,
// stessa convenzione di puntoRelativoRuotato/CSS rotate su questo sistema di coordinate y-down).
function ruotaPunto(punto, centro, angoloGradi) {
  const rad = (angoloGradi * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = punto.x - centro.x;
  const dy = punto.y - centro.y;
  return {
    x: centro.x + dx * cos - dy * sin,
    y: centro.y + dx * sin + dy * cos,
  };
}

// Prepara una sessione di rotazione di gruppo: centro geometrico della selezione, posizioni
// originali (punto di partenza per la misura della distanza) e id della basetta più lontana
// dal centro, che è quella con lo spostamento maggiore per un dato angolo di rotazione.
function creaSessioneRotazione(selezionate) {
  if (selezionate.length < 2) return null;

  const centro = {
    x: selezionate.reduce((s, ist) => s + ist.x, 0) / selezionate.length,
    y: selezionate.reduce((s, ist) => s + ist.y, 0) / selezionate.length,
  };

  let idPiuLontano = selezionate[0].id;
  let raggioMax = -1;
  const originali = selezionate.map((ist) => {
    const raggio = Math.hypot(ist.x - centro.x, ist.y - centro.y);
    if (raggio > raggioMax) {
      raggioMax = raggio;
      idPiuLontano = ist.id;
    }
    return { id: ist.id, x: ist.x, y: ist.y, zona: ist.zona, templateId: ist.templateId };
  });

  return { centro, originali, idPiuLontano, angolo: 0 };
}

// Distribuisce `totale` elementi su `numeroLinee` linee nel modo più omogeneo possibile,
// mettendo l'eventuale resto nelle prime linee (es. 7 su 2 linee → 4 e 3).
function distribuisciSuLinee(totale, numeroLinee) {
  const base = Math.floor(totale / numeroLinee);
  const resto = totale % numeroLinee;
  return Array.from({ length: numeroLinee }, (_, i) => base + (i < resto ? 1 : 0));
}

// Direzione principale (in radianti) della disposizione attuale dei punti, via analisi
// della varianza (asse di massima dispersione): le linee della formazione seguiranno
// questo orientamento invece di uno fisso rispetto allo schermo.
function direzionePrincipale(punti, centro) {
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const p of punti) {
    const dx = p.x - centro.x;
    const dy = p.y - centro.y;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  if (Math.abs(sxx) < 1e-6 && Math.abs(syy) < 1e-6 && Math.abs(sxy) < 1e-6) return 0;
  return 0.5 * Math.atan2(2 * sxy, sxx - syy);
}

function SelezioneMultipla({ containerRef, attivo, rotazioneArea = 0, zoom = 1 }) {
  const { pxPerPollice, puntoNelTavolo } = useTavolo();
  const { istanze, spostaIstanza } = useTavoloState();
  const { basette } = useLibreria();
  const [rettangolo, setRettangolo] = useState(null);
  const [selezioneCorrente, setSelezioneCorrente] = useState([]);
  const [rotazioneGruppo, setRotazioneGruppo] = useState(null);
  const [trascinamentoLive, setTrascinamentoLive] = useState(null);
  const trascinamentoAttivoRef = useRef(false);
  const eliminaSelezione = useEliminaSelezione();

  const puntoRelativo = (clientX, clientY) =>
    puntoRelativoRuotato(clientX, clientY, containerRef.current, rotazioneArea, zoom);

  const emettiSelezione = (ids) => {
    window.dispatchEvent(new CustomEvent(EVENTO_SELEZIONE_MULTIPLA, { detail: { ids } }));
  };

  // Tiene traccia della selezione corrente (emessa da qui stesso o da una Basetta)
  // per poter riformare la formazione con i tasti 1/2/3 anche fuori dal trascinamento del rettangolo.
  useEffect(() => {
    const onSelezione = (e) => setSelezioneCorrente(e.detail.ids);
    window.addEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
    return () => window.removeEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
  }, []);

  // Tiene traccia dello spostamento live del trascinamento di gruppo in corso (emesso dalla
  // Basetta trascinata): usato per non scrivere sullo stato condiviso durante una rotazione di
  // gruppo (Q/W) che avviene mentre il drag è ancora attivo, e per calcolare la posizione live
  // (traslazione + rotazione) della basetta più lontana mostrata dalla misura sottostante.
  useEffect(() => {
    const onTrascinamento = (e) => {
      const { dx, dy, fine, annulla } = e.detail;
      if (fine || annulla) {
        trascinamentoAttivoRef.current = false;
        setTrascinamentoLive(null);
        // La sessione di rotazione, se basata su posizioni pre-drag, non è più valida una volta
        // che il drag ha scritto le nuove posizioni sullo stato condiviso: si riparte da capo.
        setRotazioneGruppo(null);
        return;
      }
      if (!trascinamentoAttivoRef.current) {
        trascinamentoAttivoRef.current = true;
        // Un drag che inizia mentre una rotazione senza drag era già in corso: le posizioni sono
        // già state scritte sullo stato condiviso finora, quindi si riparte da una sessione pulita
        // per non applicare due volte lo stesso angolo (una scritta sullo stato, una via offset live).
        setRotazioneGruppo(null);
      }
      setTrascinamentoLive({ dx, dy });
    };
    window.addEventListener(EVENTO_TRASCINAMENTO_GRUPPO, onTrascinamento);
    return () => window.removeEventListener(EVENTO_TRASCINAMENTO_GRUPPO, onTrascinamento);
  }, []);

  // Dispone le basette selezionate su `numeroLinee` linee, distribuite nel modo più omogeneo
  // possibile, orientate secondo la direzione attuale della selezione e distanziate di almeno
  // 1 pollice (centro-centro, in base all'ingombro massimo tra le basette coinvolte).
  const disponiInFormazione = useCallback((numeroLinee) => {
    const selezionate = istanze.filter((ist) => selezioneCorrente.includes(ist.id));
    if (selezionate.length < 2) return;

    const centro = {
      x: selezionate.reduce((s, ist) => s + ist.x, 0) / selezionate.length,
      y: selezionate.reduce((s, ist) => s + ist.y, 0) / selezionate.length,
    };

    const raggioMassimo = selezionate.reduce((max, ist) => {
      const template = basette.find((b) => b.id === ist.templateId) || { forma: 'tonda' };
      const dim = calcolaDimensioniBasettaPx(template, pxPerPollice);
      return Math.max(max, dim.larghezza / 2, dim.altezza / 2);
    }, 0);
    const passo = 2 * raggioMassimo + polliciAPx(DISTANZA_MINIMA_POLLICI, pxPerPollice);

    const angolo = direzionePrincipale(selezionate, centro);
    const u = { x: Math.cos(angolo), y: Math.sin(angolo) };
    const v = { x: -Math.sin(angolo), y: Math.cos(angolo) };

    const conteggiPerLinea = distribuisciSuLinee(selezionate.length, numeroLinee);
    const ordinate = [...selezionate].sort(
      (a, b) => (a.x - centro.x) * u.x + (a.y - centro.y) * u.y - ((b.x - centro.x) * u.x + (b.y - centro.y) * u.y),
    );

    let indice = 0;
    conteggiPerLinea.forEach((conteggio, riga) => {
      const offsetRiga = riga - (numeroLinee - 1) / 2;
      for (let i = 0; i < conteggio; i++) {
        const ist = ordinate[indice];
        indice++;
        const offsetLinea = i - (conteggio - 1) / 2;
        const x = centro.x + offsetLinea * passo * u.x + offsetRiga * passo * v.x;
        const y = centro.y + offsetLinea * passo * u.y + offsetRiga * passo * v.y;
        const zona = puntoNelTavolo(x, y) ? 'tavolo' : 'staging';
        const distanza = ist.zona === 'tavolo' && zona === 'tavolo' ? Math.hypot(x - ist.x, y - ist.y) / pxPerPollice : null;
        spostaIstanza(ist.id, x, y, zona, distanza);
      }
    });
  }, [istanze, selezioneCorrente, basette, pxPerPollice, puntoNelTavolo, spostaIstanza]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        if (selezioneCorrente.length < 2) return;
        e.preventDefault();
        disponiInFormazione(Number(e.key));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selezioneCorrente, disponiInFormazione]);

  // Canc/Backspace con almeno una basetta selezionata: rimuove tutte le basette selezionate.
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (selezioneCorrente.length === 0) return;
      e.preventDefault();
      eliminaSelezione(selezioneCorrente);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selezioneCorrente, eliminaSelezione]);

  // Q/W con più basette selezionate: ruota l'intero gruppo attorno al proprio centro geometrico
  // (anziché ogni basetta attorno al proprio centro, comportamento disattivato in Basetta quando
  // il gruppo è attivo). La sessione parte al primo Q/W premuto, accumula l'angolo finché il tasto
  // resta premuto (keydown ripetuti) e si chiude al rilascio.
  const ruotaGruppo = useCallback(
    (delta) => {
      setRotazioneGruppo((precedente) => {
        const base = precedente || creaSessioneRotazione(istanze.filter((ist) => selezioneCorrente.includes(ist.id)));
        if (!base) return precedente;
        return { ...base, angolo: base.angolo + delta };
      });
    },
    [istanze, selezioneCorrente],
  );

  // Applica la rotazione corrente della sessione. Se è in corso anche un trascinamento di gruppo,
  // non scrive sullo stato condiviso (che verrà aggiornato solo al rilascio del mouse): trasmette
  // invece lo spostamento live dovuto alla sola rotazione, che ogni Basetta selezionata somma alla
  // propria posizione trascinata corrente per rendere la rotazione visibile in tempo reale.
  // Senza trascinamento in corso, il comportamento resta quello di sempre: applicazione immediata.
  useEffect(() => {
    if (!rotazioneGruppo) return;

    if (trascinamentoLive) {
      const offsets = rotazioneGruppo.originali.map(({ id, x, y }) => {
        const ruotato = ruotaPunto({ x, y }, rotazioneGruppo.centro, rotazioneGruppo.angolo);
        return { id, dx: ruotato.x - x, dy: ruotato.y - y };
      });
      window.dispatchEvent(new CustomEvent(EVENTO_ROTAZIONE_GRUPPO, { detail: { offsets } }));
      return;
    }

    rotazioneGruppo.originali.forEach(({ id, x, y, zona }) => {
      const nuovo = ruotaPunto({ x, y }, rotazioneGruppo.centro, rotazioneGruppo.angolo);
      const zonaArrivo = puntoNelTavolo(nuovo.x, nuovo.y) ? 'tavolo' : 'staging';
      const distanza =
        zona === 'tavolo' && zonaArrivo === 'tavolo' ? Math.hypot(nuovo.x - x, nuovo.y - y) / pxPerPollice : null;
      spostaIstanza(id, nuovo.x, nuovo.y, zonaArrivo, distanza);
    });
  }, [rotazioneGruppo, trascinamentoLive, puntoNelTavolo, pxPerPollice, spostaIstanza]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (selezioneCorrente.length < 2) return;
      if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        ruotaGruppo(-INCREMENTO_ROTAZIONE_GRUPPO);
      } else if (e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        ruotaGruppo(INCREMENTO_ROTAZIONE_GRUPPO);
      }
    };
    const onKeyUp = (e) => {
      if (e.key === 'q' || e.key === 'Q' || e.key === 'w' || e.key === 'W') {
        setRotazioneGruppo((sessione) => (sessione ? null : sessione));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [selezioneCorrente, ruotaGruppo]);

  const onPointerDown = (e) => {
    // Solo tasto sinistro: il destro è riservato al pan dell'intera area (vedi AreaLavoro).
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const punto = puntoRelativo(e.clientX, e.clientY);
    setRettangolo({ origine: punto, corrente: punto });
  };

  const onPointerMove = (e) => {
    if (!rettangolo) return;
    const punto = puntoRelativo(e.clientX, e.clientY);
    setRettangolo((r) => (r ? { ...r, corrente: punto } : r));
  };

  const onPointerUp = () => {
    if (!rettangolo) return;
    const { origine, corrente } = rettangolo;
    const trascinato = Math.hypot(corrente.x - origine.x, corrente.y - origine.y);
    setRettangolo(null);

    if (trascinato < SOGLIA_TRASCINAMENTO_PX) {
      emettiSelezione([]);
      return;
    }

    const minX = Math.min(origine.x, corrente.x);
    const maxX = Math.max(origine.x, corrente.x);
    const minY = Math.min(origine.y, corrente.y);
    const maxY = Math.max(origine.y, corrente.y);

    const selezionati = istanze
      .filter((ist) => ist.x >= minX && ist.x <= maxX && ist.y >= minY && ist.y <= maxY)
      .map((ist) => ist.id);

    emettiSelezione(selezionati);
  };

  const rettangoloStyle = rettangolo && {
    left: Math.min(rettangolo.origine.x, rettangolo.corrente.x),
    top: Math.min(rettangolo.origine.y, rettangolo.corrente.y),
    width: Math.abs(rettangolo.corrente.x - rettangolo.origine.x),
    height: Math.abs(rettangolo.corrente.y - rettangolo.origine.y),
  };

  // Basetta più lontana dal centro durante una rotazione di gruppo in corso: la sua distanza
  // percorsa (centro-centro, dalla posizione di partenza della sessione, il fantasma fermo) viene
  // mostrata dal vero e proprio componente MisuraDistanza, riusato così com'è per il trascinamento
  // singolo. La posizione di destinazione è calcolata dalla sola rotazione attorno al centro della
  // selezione, più l'eventuale spostamento live di un trascinamento di gruppo ancora in corso — non
  // viene letta dallo stato condiviso, che durante il drag non viene aggiornato (vedi sopra).
  const origineLontana =
    rotazioneGruppo && rotazioneGruppo.originali.find((o) => o.id === rotazioneGruppo.idPiuLontano);
  const destinazioneLontana =
    origineLontana &&
    (() => {
      const ruotato = ruotaPunto(origineLontana, rotazioneGruppo.centro, rotazioneGruppo.angolo);
      return trascinamentoLive
        ? { x: ruotato.x + trascinamentoLive.dx, y: ruotato.y + trascinamentoLive.dy }
        : ruotato;
    })();
  const templateLontano = origineLontana && basette.find((b) => b.id === origineLontana.templateId);

  return (
    <>
      {attivo && (
        <div
          className={styles.areaCattura}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
      )}
      {attivo && rettangoloStyle && <div className={styles.rettangolo} style={rettangoloStyle} />}
      {origineLontana && destinazioneLontana && templateLontano && (
        <MisuraDistanza
          origine={{ x: origineLontana.x, y: origineLontana.y }}
          destinazione={destinazioneLontana}
          dimensionePx={calcolaDimensioniBasettaPx(templateLontano, pxPerPollice)}
          forma={templateLontano.forma}
          colore={templateLontano.colore}
          pollici={Math.hypot(destinazioneLontana.x - origineLontana.x, destinazioneLontana.y - origineLontana.y) / pxPerPollice}
        />
      )}
    </>
  );
}

export default SelezioneMultipla;
