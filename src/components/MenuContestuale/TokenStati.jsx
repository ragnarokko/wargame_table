import { useMemo } from 'react';
import { STATI_UNITA } from '../../config/statiUnita';
import { useTavoloState } from '../../contexts/TavoloStateContext';
import styles from './MenuContestuale.module.css';

// Token di stato delle unità (avanzato, shock, fallback, shoot, fought, scelti dal menu del tasto destro): uno per
// unità, al centro dei suoi modelli ancora in vita (o di tutti, se sono tutti grigi), con un'etichetta per stato.
// Non intercetta il mouse e resta dritto anche con l'area ruotata.
function TokenStati({ rotazioneArea = 0 }) {
  const { istanze } = useTavoloState();

  const token = useMemo(() => {
    const perUnita = new Map();
    for (const ist of istanze) {
      if (!perUnita.has(ist.templateId)) perUnita.set(ist.templateId, []);
      perUnita.get(ist.templateId).push(ist);
    }
    const risultato = [];
    for (const [templateId, modelli] of perUnita) {
      const stati = STATI_UNITA.filter((s) => modelli.some((m) => m.stati?.includes(s.id)));
      if (stati.length === 0) continue;
      const vivi = modelli.filter((m) => !m.morta);
      const riferimento = vivi.length > 0 ? vivi : modelli;
      risultato.push({
        templateId,
        stati,
        x: riferimento.reduce((somma, m) => somma + m.x, 0) / riferimento.length,
        y: riferimento.reduce((somma, m) => somma + m.y, 0) / riferimento.length,
      });
    }
    return risultato;
  }, [istanze]);

  return token.map((t) => (
    <div
      key={t.templateId}
      className={styles.tokenUnita}
      style={{ left: t.x, top: t.y, transform: `translate(-50%, -50%) rotate(${-rotazioneArea}deg)` }}
    >
      {t.stati.map((s) => (
        <span key={s.id} className={styles.token} style={{ backgroundColor: s.colore }}>
          {s.nome}
        </span>
      ))}
    </div>
  ));
}

export default TokenStati;
