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

// Unità (template con campo `esercito`) a cui appartengono le basette selezionate, dalla più rappresentata alla
// meno; vuoto se nessuna basetta selezionata appartiene a un'unità esercito.
function unitaDaSelezione(ids, istanze, basette) {
  const conteggio = new Map();
  for (const id of ids) {
    const templateId = istanze.find((i) => i.id === id)?.templateId;
    if (templateId && basette.find((b) => b.id === templateId)?.esercito) {
      conteggio.set(templateId, (conteggio.get(templateId) ?? 0) + 1);
    }
  }
  return [...conteggio].sort((a, b) => b[1] - a[1]).map(([templateId]) => templateId);
}

// Attacco di una o più unità contro un'altra: con le unità selezionate (anche diverse, per esempio con il
// rettangolo di selezione) il tasto E "arma" l'attacco, e il click su una basetta di un'altra unità apre la
// scheda Duello di "Botte!" (finestra separata, vedi finestraDuello.js) con un riquadro per ogni attaccante
// (distanza minima dalle basette del bersaglio e armi) e il bersaglio. E di nuovo o Esc annulla.
function Duello() {
  const { basette } = useLibreria();
  const { istanze } = useTavoloState();
  const { pxPerPollice } = useTavolo();
  // templateId delle unità attaccanti quando l'attacco è "armato", altrimenti null.
  const [attaccanti, setAttaccanti] = useState(null);
  const [avviso, setAvviso] = useState('');
  const selezioneRef = useRef([]);
  const attaccantiRef = useRef(null);
  const timerAvvisoRef = useRef(null);
  // Valori correnti letti dai listener su window (registrati una volta sola) senza doverli rinnovare ad ogni render.
  const datiRef = useRef({});
  datiRef.current = { basette, istanze, pxPerPollice };
  attaccantiRef.current = attaccanti;

  useEffect(() => {
    const mostraAvviso = (testo) => {
      setAvviso(testo);
      clearTimeout(timerAvvisoRef.current);
      timerAvvisoRef.current = setTimeout(() => setAvviso(''), DURATA_AVVISO_MS);
    };

    const lancia = async (idAttaccanti, idDifensore) => {
      const { basette, istanze, pxPerPollice } = datiRef.current;
      const tDif = basette.find((b) => b.id === idDifensore);
      if (!tDif) return;
      // Solo i modelli attivi: le basette grigie (eliminate con R) non contano né per il numero né per la distanza.
      const istDif = istanze.filter((i) => i.templateId === tDif.id && !i.morta);
      if (!istDif.length) {
        mostraAvviso("L'unità bersaglio non ha più modelli.");
        return;
      }
      // Distanze calcolate subito, sullo stato di adesso: la finestra si apre e si riempie dopo.
      const gruppo = [];
      for (const id of idAttaccanti) {
        const tAtt = basette.find((b) => b.id === id);
        const istAtt = istanze.filter((i) => i.templateId === id && !i.morta);
        if (tAtt && istAtt.length) {
          gruppo.push({ tAtt, istAtt, distanza: distanzaMinimaUnita(istAtt, tAtt, istDif, tDif, pxPerPollice) });
        }
      }
      if (!gruppo.length) {
        mostraAvviso(idAttaccanti.length > 1 ? 'Le unità attaccanti non hanno più modelli.' : "L'unità attaccante non ha più modelli.");
        return;
      }
      const wMax = Number(tDif.w);
      const feriteAttuali =
        Number.isFinite(wMax) && wMax > 0 ? istDif.map((i) => Math.min(i.ferite ?? wMax, wMax)) : undefined;
      const costruisciDati = async () => {
        await caricaDatiArmiSeNecessario().catch(() => {});
        const attaccantiDati = gruppo.map(({ tAtt, istAtt, distanza }) => ({
          id: tAtt.id,
          nome: tAtt.nome,
          esercito: tAtt.esercito,
          // Modelli attivi: basette ancora sul campo e non grigie.
          modelli: istAtt.length,
          distanza,
          armi: estraiArmi(tAtt),
        }));
        return {
          type: 'wh40-duello',
          attaccanti: attaccantiDati,
          // Campi del formato con un solo attaccante, per un calcolatore non ancora aggiornato.
          distanza: attaccantiDati[0].distanza,
          attaccante: attaccantiDati[0],
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
      const armati = attaccantiRef.current;
      if (!armati) return;
      const { istanze, basette } = datiRef.current;
      const bersaglio = unitaDaSelezione(ids, istanze, basette).find((id) => !armati.includes(id));
      // Selezione vuota, di basette senza unità o solo delle unità attaccanti: si resta in attesa del bersaglio.
      if (!bersaglio) return;
      setAttaccanti(null);
      lancia(armati, bersaglio);
    };

    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'Escape') {
        setAttaccanti(null);
        return;
      }
      if ((e.key !== 'e' && e.key !== 'E') || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (attaccantiRef.current) {
        setAttaccanti(null);
        return;
      }
      const { istanze, basette } = datiRef.current;
      const ids = selezioneRef.current;
      if (!ids.length) {
        mostraAvviso('Seleziona prima una o più unità attaccanti, poi premi E.');
        return;
      }
      const unita = unitaDaSelezione(ids, istanze, basette);
      if (!unita.length) {
        mostraAvviso("L'attacco funziona con le unità create in Creazione Esercito.");
        return;
      }
      setAvviso('');
      setAttaccanti(unita);
    };

    window.addEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timerAvvisoRef.current);
    };
  }, []);

  const nomiAttaccanti = attaccanti
    ? attaccanti.map((id) => basette.find((b) => b.id === id)?.nome).filter(Boolean).join(', ')
    : '';
  if (!nomiAttaccanti && !avviso) return null;
  return (
    <div className={`${styles.banner} ${nomiAttaccanti ? '' : styles.avviso}`} role="status">
      {nomiAttaccanti ? (
        <>
          ⚔ Attacco con <b>{nomiAttaccanti}</b>: clicca l'unità bersaglio (E o Esc per annullare)
        </>
      ) : (
        avviso
      )}
    </div>
  );
}

export default Duello;
