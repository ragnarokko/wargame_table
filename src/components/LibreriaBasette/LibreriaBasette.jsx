import { useState } from 'react';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import PannelloEspandibile from '../PannelloEspandibile/PannelloEspandibile';
import BasettaForm from './BasettaForm';
import styles from './LibreriaBasette.module.css';

const COLONNE_STAGING = 6;
const PASSO_STAGING = 34;

function LibreriaBasette() {
  const { basette, aggiungiBasetta, modificaBasetta, rimuoviBasetta, esportaJSON, importaJSON } = useLibreria();
  const { istanze, schieraBasetta } = useTavoloState();
  const [formAperto, setFormAperto] = useState(false);
  const [basettaInModifica, setBasettaInModifica] = useState(null);

  const handleChiudi = () => {
    setFormAperto(false);
    setBasettaInModifica(null);
  };

  const handleSalva = (dati) => {
    if (basettaInModifica) {
      modificaBasetta(basettaInModifica.id, dati);
    } else {
      aggiungiBasetta(dati);
    }
    handleChiudi();
  };

  const handleModifica = (basetta) => {
    setBasettaInModifica(basetta);
    setFormAperto(true);
  };

  const handleNuova = () => {
    setBasettaInModifica(null);
    setFormAperto(true);
  };

  const handleSchiera = (basetta) => {
    const n = istanze.length;
    schieraBasetta(
      basetta.id,
      24 + (n % COLONNE_STAGING) * PASSO_STAGING,
      24 + Math.floor(n / COLONNE_STAGING) * PASSO_STAGING,
      'staging',
    );
  };

  const handleImporta = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await importaJSON(file);
    } catch (err) {
      alert('Import fallito: ' + err.message);
    }
    e.target.value = '';
  };

  return (
    <div className={styles.pannello}>
      <div className={styles.intestazione}>
        <h3>Libreria basette</h3>
        <div className={styles.azioniIntestazione}>
          <button onClick={esportaJSON} title="Esporta libreria in JSON">
            ⬇
          </button>
          <label className={styles.importaLabel} title="Importa libreria da JSON">
            ⬆
            <input type="file" accept="application/json" onChange={handleImporta} hidden />
          </label>
        </div>
      </div>

      <ul className={styles.lista}>
        {basette.map((b) => (
          <li key={b.id} className={styles.riga}>
            <span className={styles.pallino} style={{ backgroundColor: b.colore }} />
            <span className={styles.nome}>{b.nome}</span>
            <div className={styles.azioni}>
              <button onClick={() => handleSchiera(b)} title="Schiera in staging">
                + Tavolo
              </button>
              <button onClick={() => handleModifica(b)} title="Modifica">
                ✎
              </button>
              <button onClick={() => rimuoviBasetta(b.id)} title="Rimuovi dalla libreria">
                ✕
              </button>
            </div>
          </li>
        ))}
        {basette.length === 0 && <li className={styles.vuoto}>Nessuna basetta in libreria</li>}
      </ul>

      <PannelloEspandibile
        titolo={basettaInModifica ? '✎ Modifica basetta' : '+ Nuova basetta'}
        aperto={formAperto}
        onToggle={() => (formAperto ? handleChiudi() : handleNuova())}
      >
        <BasettaForm basettaIniziale={basettaInModifica} onSalva={handleSalva} onAnnulla={handleChiudi} />
      </PannelloEspandibile>
    </div>
  );
}

export default LibreriaBasette;
