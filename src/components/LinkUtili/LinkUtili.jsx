import { useState } from 'react';
import Modale from '../Modale/Modale';
import styles from './LinkUtili.module.css';

const LINK = [
  { url: 'https://rapidingress.com/40k-layout-reference/ththa', descrizione: 'Terreni reference' },
  {
    url: 'https://www.tabletopbattles.com/ruleshammer-terrain-guide-11th-edition',
    descrizione: 'Regole visibilità e copertura',
  },
  { url: 'https://www.warhammer-community.com/en-gb/downloads/warhammer-40000/', descrizione: 'GW download' },
  { url: 'https://mfm.warhammer-community.com/it', descrizione: 'Munitorum Field Manual' },
  { url: 'https://gdmissions.app/11th/layouts/take-and-hold', descrizione: 'GDM' },
];

// Tasto "Link": apre una finestra con un elenco di link utili, aperti in una nuova scheda.
function LinkUtili() {
  const [aperto, setAperto] = useState(false);

  return (
    <>
      <button type="button" className={styles.pulsante} onClick={() => setAperto(true)}>
        🔗 Link
      </button>
      <Modale titolo="Link utili" aperto={aperto} onChiudi={() => setAperto(false)}>
        <ul className={styles.lista}>
          {LINK.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.descrizione}
              </a>
            </li>
          ))}
        </ul>
      </Modale>
    </>
  );
}

export default LinkUtili;
