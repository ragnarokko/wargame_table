// Capitolo (sotto-fazione) dei distaccamenti degli Space Marines, mostrato accanto al nome nel pannello
// Eserciti. I CSV di army_builder/ non lo contengono: la tabella è fatta a mano ricavandolo dal contenuto
// del distaccamento (unità e personaggi citati nelle sue regole e potenziamenti). Chiave = id del
// distaccamento in `distaccamenti.csv`; i distaccamenti generici (Gladius, Ironstorm, ...) non compaiono.
export const CAPITOLO_DISTACCAMENTO = {
  '000001004': 'Blood Angels', // Angelic Inheritors
  '000001214': 'Blood Angels', // Encarmine Speartip
  '000001215': 'Blood Angels', // Wrath of the Doomed
  '000000835': 'Dark Angels', // Inner Circle Task Force
  '000001059': 'Dark Angels', // Wrath of the Rock
  '000001205': 'Dark Angels', // Darkflight Pursuit
  '000001008': 'Space Wolves', // Champions of Fenris
  '000001070': 'Space Wolves', // Saga of the Beastslayer
  '000001126': 'Space Wolves', // Saga of the Great Wolf
  '000001209': 'Black Templars', // Marshal’s Household
  '000001230': 'Black Templars', // Vow-sworn Crusaders
  '000001231': 'Black Templars', // Fist of the God-Emperor
  '000001146': 'Imperial Fists', // Ceramite Sentinels
  '000001086': 'Salamanders', // Forgefather’s Seekers
  '000001119': 'White Scars', // Spearpoint Task Force
  '000001120': 'Ultramarines', // Blade of Ultramar
  '000001104': 'Raven Guard', // Shadowmark Talon
  '000001232': 'Iron Hands', // Medusa's Wrath
  '000000808': 'Deathwatch', // Black Spear Task Force
  '000001229': 'Deathwatch', // Deathwatch Support
};

export const capitoloDistaccamento = (id) => CAPITOLO_DISTACCAMENTO[id] ?? '';
