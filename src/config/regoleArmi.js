// Glossario di regole generali (armi e terreno/parole chiave) per il gruppo "Regole" del pannello Eserciti.
// A differenza delle abilità/stratagemmi (lette dai CSV di Wahapedia), queste non sono scaricabili: non esiste
// un CSV con le regole base dell'11a edizione (solo la pagina HTML delle Core Rules, senza CORS, vedi
// `src/config/regole.js`). Le descrizioni qui sotto sono quindi scritte a mano, in sintesi originale (non
// copiate dal regolamento, per non riprodurre testo protetto da copyright): vanno aggiornate a mano se
// cambiano le regole. Dove la regola ha una sezione dedicata nell'indice di `regole.js` (terreno), il link
// rimanda al testo ufficiale completo.
import { URL_REGOLE } from './regole';

// Regole/parole chiave delle armi (profili d'arma): quelle già interpretate dal tab Efficienza/Duello
// (vedi CLAUDE.md, calcolo `efRegole`) più altre comuni non calcolate automaticamente (segnalate sotto).
export const REGOLE_ARMI = [
  { nome: 'Tiro rapido N (Rapid Fire N)', descrizione: 'Contro un bersaglio a distanza pari o inferiore alla metà della gittata, l\'arma aggiunge N attacchi in più per ogni modello che la usa.' },
  { nome: 'Melta N', descrizione: 'Contro un bersaglio a distanza pari o inferiore alla metà della gittata, il danno di ogni ferita non salvata di quest\'arma aumenta di N.' },
  { nome: 'Colpi in serie N (Sustained Hits N)', descrizione: 'Un tiro per colpire naturale di 6 genera N colpi automatici in più, senza bisogno di un nuovo tiro per colpire.' },
  { nome: 'Colpi letali (Lethal Hits)', descrizione: 'Un tiro per colpire naturale di 6 ferisce automaticamente, senza bisogno del tiro per ferire.' },
  { nome: 'Ferite devastanti (Devastating Wounds)', descrizione: 'Un tiro per ferire naturale di 6 infligge il danno dell\'arma come ferite mortali, ignorando qualsiasi salvezza (anche invulnerabile).' },
  { nome: 'Doppio collegamento (Twin-linked)', descrizione: 'Si rilancia il tiro per ferire di quest\'arma.' },
  { nome: 'Torrente (Torrent)', descrizione: 'L\'arma colpisce automaticamente: niente tiro per colpire, quindi nessun modificatore a colpire si applica.' },
  { nome: 'Lancia (Lance)', descrizione: 'Se il portatore ha effettuato una carica questo turno, +1 al tiro per ferire di quest\'arma in mischia.' },
  { nome: 'Pesante (Heavy)', descrizione: 'Se il portatore non si è mosso questo turno, +1 al tiro per colpire di quest\'arma.' },
  { nome: 'Anti-PAROLA N+ (Anti-X N+)', descrizione: 'Contro un bersaglio con quella parola chiave, un tiro per ferire pari o superiore a N è sempre una ferita critica: successo automatico, a prescindere dalla Resistenza del bersaglio.' },
  { nome: 'Esplosione (Blast)', descrizione: 'L\'arma ottiene +1 attacco ogni 5 modelli pieni dell\'unità bersaglio (non calcolata nel tab Efficienza/Duello: dipende dai modelli del bersaglio, non dal profilo dell\'arma).' },
  { nome: 'Ignora la copertura (Ignores Cover)', descrizione: 'Il bersaglio non ha il beneficio della copertura contro gli attacchi di quest\'arma (non calcolata nel tab Efficienza/Duello).' },
  { nome: 'Pericolosa (Hazardous)', descrizione: 'Dopo che l\'arma è stata usata, per ogni modello che l\'ha usata si tira un D6 (hazard roll, Core Rules 06.03): con 1-2 l\'unità subisce 1 ferita mortale, 3 ferite mortali se ogni modello dell\'unità è MOSTRO/VEICOLO (non calcolata nel tab Efficienza/Duello).', ancora: 'Hazard-Rolls' },
  { nome: 'Fuoco in picchiata (Plunging Fire)', descrizione: 'Contro un\'unità bersaglio visibile con almeno un modello a livello del suolo, se l\'attaccante è su una sezione di terreno alta 3" o più, oppure ha la parola chiave TOWERING e il bersaglio è entro 12", l\'attacco a distanza ha +1 al tiro per colpire.', ancora: 'Plunging-Fire' },
  { nome: 'Pistola (Pistol)', descrizione: 'Si può sparare anche se il portatore è a distanza d\'impegno dal nemico, e può bersagliare un\'unità a contatto con lui; di solito non si combina nello stesso attacco con armi non-Pistola (esclusione non calcolata nel tab Efficienza/Duello).' },
  { nome: 'Assalto (Assault)', descrizione: 'L\'arma si può usare anche se il portatore ha avanzato questo turno.' },
  { nome: 'Colpo singolo (One Shot)', descrizione: 'L\'arma si può usare una sola volta per l\'intera partita.' },
  { nome: 'Precisione (Precision)', descrizione: 'Contro un\'unità con uno o più modelli Personaggio, i colpi di quest\'arma possono essere assegnati a un Personaggio a scelta invece di seguire l\'ordine normale di assegnazione.' },
  { nome: 'Attacchi extra (Extra Attacks)', descrizione: 'Un\'arma da mischia con questa regola si usa in aggiunta a un\'altra arma da mischia scelta dal modello, non al posto di quella.' },
  { nome: 'Fuoco indiretto (Indirect Fire)', descrizione: 'Può colpire un bersaglio non visibile, a distanza pari o inferiore alla metà della gittata, con -1 al tiro per colpire se il bersaglio non è davvero visibile.' },
];

// Parole chiave/regole di terreno e di unità utili durante la partita, non legate a un'arma specifica.
// `ancora`, quando c'è, è l'id della sezione corrispondente nel capitolo Terrain di `regole.js` (testo ufficiale).
export const REGOLE_TERRENO = [
  { nome: 'Terreno Dense', descrizione: 'Le unità senza la parola chiave FLY o TOWERING non possono attraversarlo in orizzontale (devono scalarlo o aggirarlo); dà il beneficio della copertura a chi vi è dentro.', ancora: 'Dense' },
  { nome: 'Terreno Light', descrizione: 'Dà il beneficio della copertura solo in parte (di solito sopra una certa altezza) e non blocca la linea di vista.', ancora: 'Light' },
  { nome: 'Terreno Exposed', descrizione: 'Non dà alcun beneficio di copertura e non blocca la linea di vista.', ancora: 'Exposed' },
  { nome: 'Terreno Hidden', descrizione: 'Un modello INFANTRY/BEASTS/SWARM dentro un\'area con terreno Light/Dense, la cui unità non ha sparato questo turno né il precedente, è visibile solo a modelli nemici entro 15" (il suo "raggio di individuazione").', ancora: 'Hidden' },
  { nome: 'Terreno Obscuring', descrizione: 'Blocca la linea di vista attraverso di sé, salvo eccezioni (es. modelli con la parola chiave TOWERING).', ancora: 'Obscuring' },
  { nome: 'Terreno Solid', descrizione: 'I modelli non possono attraversarlo né sorvolarlo sotto una certa altezza, salvo regole di volo o di salto.', ancora: 'Solid' },
  { nome: 'Copertura (Benefit of Cover)', descrizione: 'Un\'unità bersagliata da un attacco a distanza ha il beneficio della copertura (e quindi -1 al tiro per colpire di quell\'attacco) se ogni suo modello è INFANTRY/BEASTS/SWARM dentro un\'area di terreno, oppure non è del tutto visibile all\'attaccante per via di terreno di mezzo: nel tab Efficienza/Duello/VSunità è il bonus "Cover" del difensore, solo per armi da tiro, non in mischia.', ancora: 'Benefit-of-Cover' },
  { nome: 'Parola chiave TOWERING', descrizione: 'Segna i modelli enormi (es. certi veicoli/mostri): alcune regole li trattano diversamente, ad esempio restando visibili oltre il terreno Obscuring, o contando per il Fuoco in picchiata anche a livello del suolo se il bersaglio è entro 12".' },
  { nome: 'Parola chiave MOBILE', descrizione: 'Parola chiave temporanea che alcune unità (es. con Super-heavy Walker) possono darsi per un movimento: permette di attraversare il terreno Dense in orizzontale per quel movimento.' },
];

export { URL_REGOLE };
