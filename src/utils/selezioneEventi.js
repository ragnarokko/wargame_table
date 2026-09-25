/**
 * Nomi degli eventi custom (window) usati per sincronizzare la selezione multipla
 * e lo spostamento di gruppo tra i componenti Basetta e SelezioneMultipla,
 * senza introdurre un nuovo Context condiviso.
 */

// detail: { ids: string[] } — elenco ordinato degli id delle basette selezionate.
export const EVENTO_SELEZIONE_MULTIPLA = 'tavolo-selezione-multipla';

// detail: { dx, dy, escludiId, fine } oppure { escludiId, annulla: true }
export const EVENTO_TRASCINAMENTO_GRUPPO = 'tavolo-trascinamento-gruppo';
