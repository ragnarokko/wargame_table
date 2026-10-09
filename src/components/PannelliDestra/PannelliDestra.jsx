import { useState } from 'react';
import TrackerPartita from '../TrackerPartita/TrackerPartita';
import RegoleEsercito from '../RegoleEsercito/RegoleEsercito';

const CHIAVE_APERTO = 'tavolo-pannello-destro';
// Chiave del vecchio stato "tracker aperto/chiuso", usata solo come ripiego se la nuova non c'è ancora.
const CHIAVE_TRACKER_VECCHIA = 'tavolo-tracker-aperto';

function leggiAperto() {
  try {
    const salvato = localStorage.getItem(CHIAVE_APERTO);
    if (salvato !== null) return salvato;
    return localStorage.getItem(CHIAVE_TRACKER_VECCHIA) === '0' ? '' : 'tracker';
  } catch {
    return 'tracker';
  }
}

// Colonna destra: Tracker partita ed Eserciti (abilità, distaccamenti, stratagemmi) come due pannelli
// chiudibili affiancati da linguette; ne resta aperto uno solo alla volta. La scelta è ricordata.
function PannelliDestra() {
  const [aperto, setApertoState] = useState(leggiAperto);

  const imposta = (valore) => {
    setApertoState(valore);
    try {
      localStorage.setItem(CHIAVE_APERTO, valore);
    } catch {
      // localStorage non disponibile: la scelta vale solo per questa sessione.
    }
  };

  return (
    <>
      <TrackerPartita aperto={aperto === 'tracker'} onApri={() => imposta('tracker')} onChiudi={() => imposta('')} />
      <RegoleEsercito aperto={aperto === 'eserciti'} onApri={() => imposta('eserciti')} onChiudi={() => imposta('')} />
    </>
  );
}

export default PannelliDestra;
