import { useEffect, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { ESERCITI } from '../../config/eserciti';
import { ALTEZZA_FASCIA_INDICATORI_PX } from '../../config/indicatori';
import { coloreDisponibile } from '../../utils/colori';
import { determinaFormaEDimensioni, generaNomeUnivoco, caricaDatiCsvSeNecessario } from './csvUnitaImport';
import { caricaDatiArmiSeNecessario } from './csvArmiImport';
import { calcolaPosizioniUnitaStaging } from '../../utils/posizionamentoStaging';
import { EVENTO_SELEZIONE_MULTIPLA } from '../../utils/selezioneEventi';
import PannelloEspandibile from '../PannelloEspandibile/PannelloEspandibile';
import PersistenzaEserciti from '../PersistenzaEserciti/PersistenzaEserciti';
import UnitaForm from './UnitaForm';
import UnitaListItem from './UnitaListItem';
import ErroreDatiCsv from './ErroreDatiCsv';
import styles from './CreazioneEsercito.module.css';

function CreazioneEsercito() {
  const { pxPerPollice, campoGiocoPx } = useTavolo();
  const { basette, aggiungiBasetta, modificaBasetta, rimuoviBasetta } = useLibreria();
  const { istanze, schieraBasette, rimuoviIstanzePerTemplate } = useTavoloState();
  const [esercitoSelezionato, setEsercitoSelezionato] = useState(ESERCITI[0].id);
  const [formAperto, setFormAperto] = useState(false);
  const [accordionAperti, setAccordionAperti] = useState(() =>
    Object.fromEntries(ESERCITI.map((es) => [es.id, true])),
  );

  // Pre-carica i dati CSV all'avvio (CreazioneEsercito è sempre montato), così di norma sono
  // già pronti quando l'utente apre "+ Nuova unità"; l'errore, se c'è, resta segnalato solo
  // dal pulsante "Aggiorna dati" che l'utente può premere per ritentare.
  useEffect(() => {
    caricaDatiCsvSeNecessario().catch(() => {});
    caricaDatiArmiSeNecessario().catch(() => {});
  }, []);

  const unitaTutte = basette.filter((b) => b.esercito);

  const contaModelli = (templateId) => istanze.filter((i) => i.templateId === templateId).length;

  const toggleAccordion = (esercitoId) =>
    setAccordionAperti((prev) => ({ ...prev, [esercitoId]: !prev[esercitoId] }));

  const handleCrea = (dati) => {
    const dimensione = determinaFormaEDimensioni(dati.baseSize);
    const nomiEsistenti = unitaTutte.filter((u) => u.esercito === esercitoSelezionato).map((u) => u.nome);
    const nomeUnivoco = generaNomeUnivoco(dati.nomeBase, nomiEsistenti);
    const templateData = {
      nome: nomeUnivoco,
      colore: dati.colore,
      esercito: esercitoSelezionato,
      datasheetId: dati.datasheetId,
      numeroModelli: dati.numeroModelli,
      immagine: '',
      mov: dati.mov,
      res: dati.res,
      w: dati.w,
      ts: dati.ts,
      tsPiu: dati.tsPiu,
      oc: dati.oc,
      fnp: dati.fnp,
      range1: dati.range1,
      range2: dati.range2,
      range3: dati.range3,
      note: dati.note,
      ...dimensione,
    };

    const nuovoTemplate = aggiungiBasetta(templateData);

    const templatesPerId = new Map(basette.map((b) => [b.id, b]));
    const istanzeStaging = istanze.filter((i) => i.zona === 'staging');
    // Il bordo superiore parte sotto la fascia degli indicatori (CP/Turno), che coprirebbe le basette.
    const areaStaging = {
      left: 0,
      top: ALTEZZA_FASCIA_INDICATORI_PX,
      width: campoGiocoPx.larghezza,
      height: campoGiocoPx.altezza - ALTEZZA_FASCIA_INDICATORI_PX,
    };

    const posizioni = calcolaPosizioniUnitaStaging({
      template: nuovoTemplate,
      numeroModelli: dati.numeroModelli,
      istanzeStaging,
      templatesPerId,
      pxPerPollice,
      areaStaging,
    });

    schieraBasette(nuovoTemplate.id, posizioni, 'staging');
    setFormAperto(false);
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
          onCrea={handleCrea}
          onAnnulla={() => setFormAperto(false)}
        />
      ) : (
        <button className={styles.nuovaBtn} onClick={() => setFormAperto(true)}>
          + Nuova unità
        </button>
      )}

      {ESERCITI.map((es) => (
        <PannelloEspandibile
          key={es.id}
          titolo={es.nome}
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
