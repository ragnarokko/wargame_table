import { useEffect, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { ESERCITI } from '../../config/eserciti';
import { ALTEZZA_FASCIA_INDICATORI_PX } from '../../config/indicatori';
import { coloreDisponibile } from '../../utils/colori';
import {
  determinaFormaEDimensioni,
  fazionePerDatasheetId,
  generaNomeUnivoco,
  caricaDatiCsvSeNecessario,
} from './csvUnitaImport';
import { caricaDatiArmiSeNecessario } from './csvArmiImport';
import { caricaDatiArmyBuilderSeNecessario } from './csvArmyBuilderImport';
import {
  calcolaPosizioniUnitaInZone,
  calcolaPosizioniUnitaStaging,
  zoneStagingEsercito,
} from '../../utils/posizionamentoStaging';
import { EVENTO_MOSTRA_UNITA, EVENTO_SELEZIONE_MULTIPLA } from '../../utils/selezioneEventi';
import PannelloEspandibile from '../PannelloEspandibile/PannelloEspandibile';
import PersistenzaEserciti from '../PersistenzaEserciti/PersistenzaEserciti';
import UnitaForm from './UnitaForm';
import UnitaListItem from './UnitaListItem';
import ErroreDatiCsv from './ErroreDatiCsv';
import ImportaLista from './ImportaLista.jsx';
import EsportaLista from './EsportaLista';
import { datiUnitaDaCsv } from './datiUnita';
import styles from './CreazioneEsercito.module.css';

function CreazioneEsercito() {
  const { pxPerPollice, campoGiocoPx, tavoloRect } = useTavolo();
  const { basette, aggiungiBasetta, modificaBasetta, rimuoviBasetta } = useLibreria();
  const { istanze, schieraBasette, rimuoviIstanzePerTemplate } = useTavoloState();
  const [esercitoSelezionato, setEsercitoSelezionato] = useState(ESERCITI[0].id);
  const [formAperto, setFormAperto] = useState(false);
  const [importaAperto, setImportaAperto] = useState(false);
  const [esportaAperto, setEsportaAperto] = useState(false);
  // Unità da mostrare in lista dopo un doppio click su una basetta: { id, n } (n cambia a ogni richiesta,
  // così anche un secondo doppio click sulla stessa unità la riporta in vista).
  const [unitaMostrata, setUnitaMostrata] = useState(null);
  const [accordionAperti, setAccordionAperti] = useState(() =>
    Object.fromEntries(ESERCITI.map((es) => [es.id, true])),
  );

  // Pre-carica i dati CSV all'avvio (CreazioneEsercito è sempre montato), così di norma sono
  // già pronti quando l'utente apre "+ Unità"; l'errore, se c'è, resta segnalato solo
  // dal pulsante "Aggiorna dati" che l'utente può premere per ritentare.
  useEffect(() => {
    caricaDatiCsvSeNecessario().catch(() => {});
    caricaDatiArmiSeNecessario().catch(() => {});
    caricaDatiArmyBuilderSeNecessario().catch(() => {});
  }, []);

  const unitaTutte = basette.filter((b) => b.esercito);

  // Doppio click su una basetta: apre l'accordion del suo esercito, così la voce è montata e
  // UnitaListItem la seleziona, ne apre i dettagli e la porta in vista; deselezionando tutto sul
  // campo la selezione in lista si toglie.
  useEffect(() => {
    const onMostra = (e) => {
      const { templateId, esercito } = e.detail;
      setAccordionAperti((prev) => ({ ...prev, [esercito]: true }));
      setUnitaMostrata((prev) => ({ id: templateId, n: (prev?.n ?? 0) + 1 }));
    };
    const onSelezione = (e) => {
      if (e.detail.ids.length === 0) setUnitaMostrata(null);
    };
    window.addEventListener(EVENTO_MOSTRA_UNITA, onMostra);
    window.addEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
    return () => {
      window.removeEventListener(EVENTO_MOSTRA_UNITA, onMostra);
      window.removeEventListener(EVENTO_SELEZIONE_MULTIPLA, onSelezione);
    };
  }, []);

  // Fazione già presente nell'esercito scelto (quella dell'ultima unità creata): "+ Unità" la
  // propone per prima invece della prima in elenco.
  const fazioneEsercito = unitaTutte
    .filter((u) => u.esercito === esercitoSelezionato)
    .map((u) => fazionePerDatasheetId(u.datasheetId))
    .filter(Boolean)
    .pop();

  // Modelli attivi di un'unità: basette ancora sul campo e non eliminate (grigie, tasto R).
  const contaModelli = (templateId) => istanze.filter((i) => i.templateId === templateId && !i.morta).length;
  // Modelli iniziali: quelli con cui l'unità è stata creata (in mancanza, tutte le basette presenti).
  const modelliIniziali = (u) =>
    Number(u.numeroModelli) || istanze.filter((i) => i.templateId === u.id).length;

  // Totale dei punti delle unità create per un esercito (le unità senza punti non contano).
  const puntiEsercito = (esercitoId) =>
    unitaTutte.filter((u) => u.esercito === esercitoId).reduce((somma, u) => somma + (Number(u.punti) || 0), 0);

  // Testo delle unità dell'esercito scelto, una riga per unità («3x Nome (80pts)»), leggibile da "Importa".
  const testoEsportazione = () => {
    const esercito = ESERCITI.find((es) => es.id === esercitoSelezionato);
    const unita = unitaTutte.filter((u) => u.esercito === esercitoSelezionato);
    const punti = puntiEsercito(esercitoSelezionato);
    const righe = [punti > 0 ? `${esercito.nome} - ${punti}pts` : esercito.nome, ''];
    for (const u of unita) {
      const modelli = modelliIniziali(u);
      righe.push(`${modelli > 0 ? `${modelli}x ` : ''}${u.nome}${Number(u.punti) > 0 ? ` (${Number(u.punti)}pts)` : ''}`);
    }
    return righe.join('\n');
  };

  const toggleAccordion = (esercitoId) =>
    setAccordionAperti((prev) => ({ ...prev, [esercitoId]: !prev[esercitoId] }));

  // Crea un'unità dell'esercito scelto (template + basette in staging). `contesto` tiene il conto di ciò che
  // è già stato creato nella stessa operazione (lo stato React si aggiorna dopo): serve a importare più unità
  // di fila senza nomi duplicati né basette sovrapposte.
  const creaUnita = (dati, contesto) => {
    const dimensione = determinaFormaEDimensioni(dati.baseSize);
    const nomeUnivoco = generaNomeUnivoco(dati.nomeBase, contesto.nomi);
    contesto.nomi.push(nomeUnivoco);
    const templateData = {
      nome: nomeUnivoco,
      colore: dati.colore,
      esercito: esercitoSelezionato,
      datasheetId: dati.datasheetId,
      numeroModelli: dati.numeroModelli,
      punti: dati.punti,
      immagine: '',
      mov: dati.mov,
      res: dati.res,
      w: dati.w,
      ts: dati.ts,
      tsPiu: dati.tsPiu,
      oc: dati.oc,
      fnp: dati.fnp,
      note: dati.note,
      abilitaEstese: dati.abilitaEstese,
      ...dimensione,
    };

    const nuovoTemplate = aggiungiBasetta(templateData);
    contesto.templatesPerId.set(nuovoTemplate.id, nuovoTemplate);

    const parametriPosizione = {
      template: nuovoTemplate,
      numeroModelli: dati.numeroModelli,
      istanzeStaging: contesto.istanzeStaging,
      templatesPerId: contesto.templatesPerId,
      pxPerPollice,
      areaStaging: contesto.areaStaging,
    };
    const posizioni = contesto.preferite
      ? calcolaPosizioniUnitaInZone({
          ...parametriPosizione,
          zone: contesto.preferite,
          zoneRiserva: contesto.riserva,
        })
      : calcolaPosizioniUnitaStaging(parametriPosizione);

    schieraBasette(nuovoTemplate.id, posizioni, 'staging');
    contesto.istanzeStaging.push(...posizioni.map((p) => ({ templateId: nuovoTemplate.id, x: p.x, y: p.y })));
    return nuovoTemplate;
  };

  const nuovoContesto = () => ({
    nomi: unitaTutte.filter((u) => u.esercito === esercitoSelezionato).map((u) => u.nome),
    templatesPerId: new Map(basette.map((b) => [b.id, b])),
    istanzeStaging: istanze.filter((i) => i.zona === 'staging'),
    // Il bordo superiore parte sotto la fascia degli indicatori (CP/Turno), che coprirebbe le basette.
    areaStaging: {
      left: 0,
      top: ALTEZZA_FASCIA_INDICATORI_PX,
      width: campoGiocoPx.larghezza,
      height: campoGiocoPx.altezza - ALTEZZA_FASCIA_INDICATORI_PX,
    },
    // Le basette vanno nello staging dell'esercito: il Rosso sopra il tavolo (o ai lati nella metà alta), il Blu
    // sotto (o ai lati nella metà bassa), mai sul tavolo.
    ...zoneStagingEsercito(esercitoSelezionato, {
      campoGiocoPx,
      tavoloRect,
      altezzaFascia: ALTEZZA_FASCIA_INDICATORI_PX,
    }),
  });

  const handleCrea = (dati) => {
    creaUnita(dati, nuovoContesto());
    setFormAperto(false);
  };

  // Importazione di una lista (New Recruit ecc.): crea nell'esercito scelto tutte le unità riconosciute,
  // ciascuna col suo numero di modelli e un colore diverso, una dopo l'altra in staging.
  const handleImporta = (elementi) => {
    const contesto = nuovoContesto();
    const esistenti = [...unitaTutte];
    for (const { unita, modelli } of elementi) {
      const colore = coloreDisponibile(esercitoSelezionato, esistenti);
      const creata = creaUnita({ ...datiUnitaDaCsv(unita, modelli), colore }, contesto);
      esistenti.push(creata);
    }
  };

  // Click sul nome di un'unità nella lista: seleziona tutte le sue basette sul campo (stesso
  // evento condiviso usato da Basetta/SelezioneMultipla), così frecce, Q/W, 1/2/3 e Canc
  // agiscono subito su di esse. Senza basette sul campo non cambia la selezione corrente.
  const handleSeleziona = (templateId) => {
    const ids = istanze.filter((i) => i.templateId === templateId).map((i) => i.id);
    if (ids.length === 0) return;
    window.dispatchEvent(new CustomEvent(EVENTO_SELEZIONE_MULTIPLA, { detail: { ids } }));
  };

  const handleRimuovi = (templateId) => {
    rimuoviIstanzePerTemplate(templateId);
    rimuoviBasetta(templateId);
  };

  const handleRinomina = (templateId, nuovoNome) => {
    if (nuovoNome.trim()) modificaBasetta(templateId, { nome: nuovoNome.trim() });
  };

  return (
    <div className={styles.pannello}>
      <ErroreDatiCsv />
      <h3>Creazione Esercito</h3>

      <PersistenzaEserciti />

      <div className={styles.tabEserciti}>
        {ESERCITI.map((es) => (
          <button
            key={es.id}
            type="button"
            className={`${styles.tabBtn} ${esercitoSelezionato === es.id ? styles.tabAttivo : ''}`}
            onClick={() => {
              setEsercitoSelezionato(es.id);
              setFormAperto(false);
            }}
          >
            {es.nome}
          </button>
        ))}
      </div>

      {formAperto ? (
        <UnitaForm
          coloreDefault={coloreDisponibile(esercitoSelezionato, unitaTutte)}
          fazioneIniziale={fazioneEsercito}
          onCrea={handleCrea}
          onAnnulla={() => setFormAperto(false)}
        />
      ) : (
        <div className={styles.rigaNuova}>
          <button className={styles.nuovaBtn} onClick={() => setFormAperto(true)}>
            + Unità
          </button>
          <button
            className={styles.secondarioBtn}
            onClick={() => setImportaAperto(true)}
            title="Importa una lista da New Recruit (o altri builder) incollandone il testo"
          >
            Importa
          </button>
          <button
            className={styles.secondarioBtn}
            onClick={() => setEsportaAperto(true)}
            title="Mostra il testo delle unità dell'esercito scelto, da copiare o salvare in un file .txt"
          >
            Esporta
          </button>
        </div>
      )}
      <ImportaLista
        aperto={importaAperto}
        nomeEsercito={ESERCITI.find((es) => es.id === esercitoSelezionato)?.nome ?? ''}
        onImporta={handleImporta}
        onChiudi={() => setImportaAperto(false)}
      />
      <EsportaLista
        aperto={esportaAperto}
        nomeEsercito={ESERCITI.find((es) => es.id === esercitoSelezionato)?.nome ?? ''}
        testo={esportaAperto ? testoEsportazione() : ''}
        onChiudi={() => setEsportaAperto(false)}
      />

      {ESERCITI.map((es) => (
        <PannelloEspandibile
          key={es.id}
          titolo={puntiEsercito(es.id) > 0 ? `${es.nome} — ${puntiEsercito(es.id)} pt` : es.nome}
          aperto={accordionAperti[es.id]}
          onToggle={() => toggleAccordion(es.id)}
        >
          <ul className={styles.lista}>
            {unitaTutte
              .filter((u) => u.esercito === es.id)
              .map((u) => (
                <UnitaListItem
                  key={u.id}
                  unita={u}
                  numeroModelli={contaModelli(u.id)}
                  modelliIniziali={modelliIniziali(u)}
                  richiesta={unitaMostrata}
                  onSeleziona={() => handleSeleziona(u.id)}
                  onRimuovi={() => handleRimuovi(u.id)}
                  onRinomina={(nuovoNome) => handleRinomina(u.id, nuovoNome)}
                />
              ))}
            {unitaTutte.filter((u) => u.esercito === es.id).length === 0 && (
              <li className={styles.vuoto}>Nessuna unità creata</li>
            )}
          </ul>
        </PannelloEspandibile>
      ))}
    </div>
  );
}

export default CreazioneEsercito;
