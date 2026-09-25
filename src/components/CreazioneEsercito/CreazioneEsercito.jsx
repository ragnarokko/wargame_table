import { useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { ESERCITI } from '../../config/eserciti';
import { trovaDimensione } from '../../config/dimensioniBasette';
import { coloreDisponibile } from '../../utils/colori';
import { calcolaPosizioniUnitaStaging } from '../../utils/posizionamentoStaging';
import PannelloEspandibile from '../PannelloEspandibile/PannelloEspandibile';
import PersistenzaEserciti from '../PersistenzaEserciti/PersistenzaEserciti';
import UnitaForm from './UnitaForm';
import UnitaListItem from './UnitaListItem';
import styles from './CreazioneEsercito.module.css';

function CreazioneEsercito() {
  const { pxPerPollice, campoGiocoPx } = useTavolo();
  const { basette, aggiungiBasetta, rimuoviBasetta } = useLibreria();
  const { istanze, schieraBasette, rimuoviIstanzePerTemplate } = useTavoloState();
  const [esercitoSelezionato, setEsercitoSelezionato] = useState(ESERCITI[0].id);
  const [formAperto, setFormAperto] = useState(false);
  const [accordionAperti, setAccordionAperti] = useState(() =>
    Object.fromEntries(ESERCITI.map((es) => [es.id, true])),
  );

  const unitaTutte = basette.filter((b) => b.esercito);

  const contaModelli = (templateId) => istanze.filter((i) => i.templateId === templateId).length;

  const toggleAccordion = (esercitoId) =>
    setAccordionAperti((prev) => ({ ...prev, [esercitoId]: !prev[esercitoId] }));

  const handleCrea = (dati) => {
    const dimensione = trovaDimensione(dati.forma, dati.dimensioneId);
    const templateData = {
      nome: dati.nomeUnita,
      colore: dati.colore,
      forma: dati.forma,
      esercito: esercitoSelezionato,
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
      ...(dati.forma === 'tonda'
        ? { diametroMm: dimensione.diametroMm }
        : { larghezzaMm: dimensione.cortoMm, lunghezzaMm: dimensione.lungoMm }),
    };

    const nuovoTemplate = aggiungiBasetta(templateData);

    const templatesPerId = new Map(basette.map((b) => [b.id, b]));
    const istanzeStaging = istanze.filter((i) => i.zona === 'staging');
    const areaStaging = { left: 0, top: 0, width: campoGiocoPx.larghezza, height: campoGiocoPx.altezza };

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

  const handleRimuovi = (templateId) => {
    rimuoviIstanzePerTemplate(templateId);
    rimuoviBasetta(templateId);
  };

  return (
    <div className={styles.pannello}>
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
                  onRimuovi={() => handleRimuovi(u.id)}
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
