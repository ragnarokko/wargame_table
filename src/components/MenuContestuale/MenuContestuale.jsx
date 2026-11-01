import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { STATI_UNITA } from '../../config/statiUnita';
import { useLibreria } from '../../contexts/LibreriaContext';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import { selezioneAttuale } from '../../utils/selezioneEventi';
import styles from './MenuContestuale.module.css';

const LARGHEZZA_SOTTOMENU_PX = 170;

// Menu del tasto destro su una basetta (vedi AreaLavoro). Agisce sull'unità cliccata o, se la basetta fa parte
// della selezione corrente, su tutte le unità selezionate. Prima riga: "Stato", che mette o toglie i token di
// stato (avanzato, shock...) mostrati sul campo da TokenStati. Montato su document.body, perché l'area di
// lavoro è ruotata e zoomata (un elemento `fixed` lì dentro ne seguirebbe la trasformazione).
function MenuContestuale({ x, y, istanzaId, onChiudi }) {
  const { istanze, impostaStatoUnita, azzeraStatiUnita } = useTavoloState();
  const { basette } = useLibreria();
  const menuRef = useRef(null);
  const [posizione, setPosizione] = useState({ x, y });
  const [sottomenuAperto, setSottomenuAperto] = useState(false);
  const [sottomenuASinistra, setSottomenuASinistra] = useState(false);

  // Unità su cui agisce il menu, fissate all'apertura: la selezione può cambiare mentre il menu è aperto.
  const templateIds = useMemo(() => {
    const cliccata = istanze.find((i) => i.id === istanzaId);
    if (!cliccata) return [];
    const selezione = selezioneAttuale();
    if (!selezione.includes(istanzaId)) return [cliccata.templateId];
    return [...new Set(istanze.filter((i) => selezione.includes(i.id)).map((i) => i.templateId))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [istanzaId]);

  const nomi = templateIds.map((id) => basette.find((b) => b.id === id)?.nome ?? '?');
  const titolo = nomi.length === 1 ? nomi[0] : `${nomi.length} unità`;

  // Uno stato è attivo se ce l'hanno tutte le unità interessate (una unità lo ha se lo ha almeno una sua basetta).
  const attivo = (stato) =>
    templateIds.length > 0 &&
    templateIds.every((id) => istanze.some((i) => i.templateId === id && i.stati?.includes(stato)));
  const haStati = istanze.some((i) => templateIds.includes(i.templateId) && i.stati?.length);

  // Tiene il menu dentro la finestra e decide da che lato aprire il sottomenu.
  useLayoutEffect(() => {
    const r = menuRef.current?.getBoundingClientRect();
    if (!r) return;
    const nuovoX = Math.max(4, Math.min(x, window.innerWidth - r.width - 4));
    const nuovoY = Math.max(4, Math.min(y, window.innerHeight - r.height - 4));
    setPosizione({ x: nuovoX, y: nuovoY });
    setSottomenuASinistra(nuovoX + r.width + LARGHEZZA_SOTTOMENU_PX > window.innerWidth);
  }, [x, y]);

  useEffect(() => {
    const fuori = (e) => {
      if (!menuRef.current?.contains(e.target)) onChiudi();
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onChiudi();
    };
    window.addEventListener('pointerdown', fuori, true);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onChiudi);
    window.addEventListener('resize', onChiudi);
    return () => {
      window.removeEventListener('pointerdown', fuori, true);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onChiudi);
      window.removeEventListener('resize', onChiudi);
    };
  }, [onChiudi]);

  if (templateIds.length === 0) return null;

  return createPortal(
    <div
      ref={menuRef}
      className={styles.menu}
      style={{ left: posizione.x, top: posizione.y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={styles.titolo} title={nomi.join(', ')}>
        {titolo}
      </div>
      <div
        className={styles.voce}
        onMouseEnter={() => setSottomenuAperto(true)}
        onMouseLeave={() => setSottomenuAperto(false)}
      >
        <button
          type="button"
          className={`${styles.riga} ${sottomenuAperto ? styles.rigaAperta : ''}`}
          onClick={() => setSottomenuAperto((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={sottomenuAperto}
        >
          <span>Stato</span>
          <span className={styles.freccia}>▸</span>
        </button>
        {sottomenuAperto && (
          <div
            className={`${styles.sottomenu} ${sottomenuASinistra ? styles.aSinistra : ''}`}
            style={{ minWidth: LARGHEZZA_SOTTOMENU_PX }}
            role="menu"
          >
            {STATI_UNITA.map((s) => {
              const acceso = attivo(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={acceso}
                  className={styles.riga}
                  onClick={() => {
                    impostaStatoUnita(templateIds, s.id, !acceso);
                    onChiudi();
                  }}
                >
                  <span className={styles.spunta}>{acceso ? '✓' : ''}</span>
                  <span className={styles.pallino} style={{ backgroundColor: s.colore }} />
                  <span>{s.nome}</span>
                </button>
              );
            })}
            {haStati && (
              <button
                type="button"
                role="menuitem"
                className={`${styles.riga} ${styles.separata}`}
                onClick={() => {
                  azzeraStatiUnita(templateIds);
                  onChiudi();
                }}
              >
                <span className={styles.spunta} />
                <span>Togli tutti</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default MenuContestuale;
