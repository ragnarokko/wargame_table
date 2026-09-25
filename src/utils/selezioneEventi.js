/**
 * Nomi degli eventi custom (window) usati per sincronizzare la selezione multipla
 * e lo spostamento di gruppo tra i componenti Basetta e SelezioneMultipla,
 * senza introdurre un nuovo Context condiviso.
 */

// detail: { ids: string[] } — elenco ordinato degli id delle basette selezionate.
export const EVENTO_SELEZIONE_MULTIPLA = 'tavolo-selezione-multipla';

// detail: { dx, dy, escludiId, fine } oppure { escludiId, annulla: true }
export const EVENTO_TRASCINAMENTO_GRUPPO = 'tavolo-trascinamento-gruppo';

// detail: { offsets: { id, dx, dy }[] } — spostamento live (solo rotazione, attorno al centro
// della selezione) da applicare "sul posto" durante un trascinamento di gruppo in corso,
// senza scrivere ancora sullo stato condiviso (vedi SelezioneMultipla + Basetta).
export const EVENTO_ROTAZIONE_GRUPPO = 'tavolo-rotazione-gruppo';

// detail: { templateId: string | null } — hover su un'unità nella lista eserciti (null per spegnere l'evidenziazione).
export const EVENTO_EVIDENZIA_UNITA = 'tavolo-evidenzia-unita';
