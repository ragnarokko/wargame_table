import { useEffect, useRef, useState } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { distanzaMinimaUnita } from '../../utils/geometriaBasette';
import { EVENTO_SELEZIONE_MULTIPLA } from '../../utils/selezioneEventi';
import { caricaDatiArmiSeNecessario } from '../CreazioneEsercito/csvArmiImport';
import { estraiArmi } from '../Calcolatore/datiCalcolatore';
import { apriDuello } from '../Calcolatore/finestraDuello';
import styles from './Duello.module.css';

const DURATA_AVVISO_MS = 3500;

// Unità (template con campo `esercito`) a cui appartengono le basette selezionate; se sono di più unità, la più
// rappresentata. null se nessuna basetta selezionata appartiene a un'unità esercito.
function unitaDaSelezione(ids, istanze, basette) {
  const conteggio = new Map();
  for (const id of ids) {
    const templateId = istanze.find((i) => i.id === id)?.templateId;
    if (templateId && basette.find((b) => b.id === templateId)?.esercito) {
      conteggio.set(templateId, (conteggio.get(templateId) ?? 0) + 1);
    }
  }
  return [...conteggio].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

// Attacco tra due unità: con un'unità selezionata il tasto E "arma" l'attacco, e il click su una basetta di
// un'altra unità apre la scheda Duello di "Botte!" (finestra separata, vedi finestraDuello.js) con le due
// unità, la distanza minima tra le loro basette e le armi dell'attaccante. E di nuovo o Esc annulla.
function Duello() {
  const { basette } = useLibreria();
  const { istanze } = useTavoloState();
  const { pxPerPollice } = useTavolo();
  // templateId dell'unità attaccante quando l'attacco è "armato", altrimenti null.
  const [attaccante, setAttaccante] = useState(null);
  const [avviso, setAvviso] = useState('');
  const selezioneRef = useRef([]);
  const attaccanteRef = useRef(null);
  const timerAvvisoRef = useRef(null);
  // Valori correnti letti dai listener su window (registrati una volta sola) senza doverli rinnovare ad ogni render.
  const datiRef = useRef({});
  datiRef.current = { basette, istanze, pxPerPollice };
  attaccanteRef.current = attaccante;

  useEffect(() => {
    const mostraAvviso = (testo) => {
      setAvviso(testo);
      clearTimeout(timerAvvisoRef.current);
      timerAvvisoRef.current = setTimeout(() => setAvviso(''), DURATA_AVVISO_MS);
    };

    const lancia = async (idAttaccante, idDifensore) => {
      const { basette, istanze, pxPerPollice } = datiRef.current;
      const tAtt = basette.find((b) => b.id === idAttaccante);
      const tDif = basette.find((b) => b.id === idDifensore);
      if (!tAtt || !tDif) return;
      // Solo i modelli attivi: le basette grigie (eliminate con R) non contano né per il numero né per la distanza.
      const istAtt = istanze.filter((i) => i.templateId === tAtt.id && !i.morta);
      const istDif = istanze.filter((i) => i.templateId === tDif.id && !i.morta);
      if (!istAtt.length || !istDif.length) {
        mostraAvviso(istAtt.length ? "L'unità bersaglio non ha più modelli." : "L'unità attaccante non ha più modelli.");
        return;
      }
      // Calcolata subito, sullo stato di adesso: la finestra si apre e si riempie dopo.
      const distanza = distanzaMinimaUnita(istAtt, tAtt, istDif, tDif, pxPerPollice);
      const wMax = Number(tDif.w);
      const feriteAttuali =
        Number.isFinite(wMax) && wMax > 0 ? istDif.map((i) => Math.min(i.ferite ?? wMax, wMax)) : undefined;
      const costruisciDati = async () => {
        await caricaDatiArmiSeNecessario().catch(() => {});
        return {
          type: 'wh40-duello',
          distanza,
          attaccante: {
            id: tAtt.id,
            nome: tAtt.nome,
            esercito: tAtt.esercito,
            // Modelli attivi: basette ancora sul campo e non grigie.
            modelli: istAtt.length,
            armi: estraiArmi(tAtt),
          },
          difensore: {
            id: tDif.id,
            nome: tDif.nome,
            esercito: tDif.esercito,
            modelli: istDif.length,
            // Ferite attuali di ogni modello attivo (si regolano con +/-); senza W numerico non si conoscono.
            ferite: feriteAttuali,
            res: tDif.res,
            ts: tDif.ts,
            tsPiu: tDif.tsPiu,
            w: tDif.w,
            fnp: tDif.fnp,
          },
        };
      };
      const aperta = await apriDuello(costruisciDati);
      if (!aperta) mostraAvviso('Popup bloccato dal browser: consenti i popup per questo sito e riprova.');
    };

    const onSelezione = (e) => {
      const ids = e.detail.ids;
      selezioneRef.current = ids;
      const armato = attaccanteRef.current;
      if (!armato) return;
      const { istanze, basette } = datiRef.current;
      const bersaglio = unitaDaSelezione(ids, istanze, basette);
      // Selezione vuota, di basette senza unità o della stessa unità attaccante: si resta in attesa del bersaglio.
      if (!bersaglio || bersaglio === armato) return;
      setAttaccante(null);
      lancia(armato, bersaglio);
    };

    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'Escape') {
        setAttaccante(null);
        return;
      }
      if ((e.key !== 'e' && e.key !== 'E') || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (attaccanteRef.current) {
        setAttaccante(null);
        return;
      }
      const { istanze, basette } = datiRef.current;
      const ids = selezioneRef.current;
      if (!ids.length) {
        mostraAvviso("Seleziona prima un'unità attaccante, poi premi E.");
        return;
      }
      const unita = unitaDaSelezione(ids, istanze, basette);
      if (!unita) {
        mostraAvviso("L'attacco funziona con le unità create in Creazione Esercito.");
        return;
      }
      setAvviso('');
      setAttaccante(unita);
    };

    window.addEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timerAvvisoRef.current);
    };
  }, []);

  const nomeAttaccante = attaccante ? basette.find((b) => b.id === attaccante)?.nome : null;
  if (!nomeAttaccante && !avviso) return null;
  return (
    <div className={`${styles.banner} ${nomeAttaccante ? '' : styles.avviso}`} role="status">
      {nomeAttaccante ? (
        <>
          ⚔ Attacco con <b>{nomeAttaccante}</b>: clicca l'unità bersaglio (E o Esc per annullare)
        </>
      ) : (
        avviso
      )}
    </div>
  );
}

export default Duello;
