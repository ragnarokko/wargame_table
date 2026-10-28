/**
 * Nomi degli eventi custom (window) usati per sincronizzare la selezione multipla
 * e lo spostamento di gruppo tra i componenti Basetta e SelezioneMultipla,
 * senza introdurre un nuovo Context condiviso.
 */

// detail: { ids: string[] } — elenco ordinato degli id delle basette selezionate.
export const EVENTO_SELEZIONE_MULTIPLA = 'tavolo-selezione-multipla';

// Ultima selezione emessa (ids delle basette selezionate): serve a chi deve aggiungere alla selezione
// corrente (Ctrl + click su una basetta, su un'unità in lista o rettangolo di selezione) senza riceverla.
let ultimaSelezione = [];
if (typeof window !== 'undefined') {
  window.addEventListener(EVENTO_SELEZIONE_MULTIPLA, (e) => {
    ultimaSelezione = e.detail.ids;
  });
}
export const selezioneAttuale = () => ultimaSelezione;

// Selezione dopo un Ctrl + selezione di `nuovi`: se sono già tutti selezionati si tolgono, altrimenti si aggiungono.
export function aggiungiOTogli(attuali, nuovi) {
  if (nuovi.length > 0 && nuovi.every((id) => attuali.includes(id))) return attuali.filter((id) => !nuovi.includes(id));
  return [...attuali, ...nuovi.filter((id) => !attuali.includes(id))];
}

// detail: { dx, dy, escludiId, fine } oppure { escludiId, annulla: true }
export const EVENTO_TRASCINAMENTO_GRUPPO = 'tavolo-trascinamento-gruppo';

// detail: { offsets: { id, dx, dy }[] } — spostamento live (solo rotazione, attorno al centro
// della selezione) da applicare "sul posto" durante un trascinamento di gruppo in corso,
// senza scrivere ancora sullo stato condiviso (vedi SelezioneMultipla + Basetta).
export const EVENTO_ROTAZIONE_GRUPPO = 'tavolo-rotazione-gruppo';

// detail: { templateId: string | null } — hover su un'unità nella lista eserciti (null per spegnere l'evidenziazione).
export const EVENTO_EVIDENZIA_UNITA = 'tavolo-evidenzia-unita';

// detail: { templateId: string, esercito: string } — doppio click su una basetta sul campo: la lista
// eserciti apre l'accordion giusto, seleziona l'unità, ne apre i dettagli e la porta in vista.
export const EVENTO_MOSTRA_UNITA = 'tavolo-mostra-unita';

// Nessun detail — un gesto a due dita (zoom/pan su tablet, vedi AreaLavoro) è appena iniziato: trascinamenti di
// basette ed elementi, rettangolo di selezione e misura del righello avviati dal primo dito vengono annullati.
export const EVENTO_ANNULLA_INTERAZIONI = 'tavolo-annulla-interazioni';

// detail: { istanzaId: string } — una basetta ha fissato il proprio popup dei dettagli (tasto I): le
// altre chiudono il proprio, così ne resta uno solo.
export const EVENTO_FISSA_POPUP = 'tavolo-fissa-popup';
