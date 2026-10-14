import { useEffect, useState } from 'react';
import { useTavolo } from '../../contexts/TavoloContext';
import { useTracker } from '../../contexts/TrackerContext';
import { COLORE_ESERCITO } from '../../config/eserciti';
import { caricaLayout, idLayout } from '../../utils/layoutTavolo';
import styles from './LayoutTavolo.module.css';

const COLORE_CENTRALE = '#1f9e84';
const COLORE_ESPANSIONE = '#2fb457';
const COLORE_OCCHIO_SEPARATE = '#ff6b6b';
const COLORE_OCCHIO_SINGOLA = '#8fe3c0';

const aPunti = (punti) => punti.map(([x, y]) => `${x},${y}`).join(' ');

// Teschio e castello disegnati in un riquadro di ±12 e rimpiccioliti dal gruppo che li contiene.
function Teschio() {
  return (
    <g fill="#fff">
      <circle cx="0" cy="-1" r="5.5" />
      <rect x="-3" y="2" width="6" height="4.5" rx="1" />
      <circle cx="-2.3" cy="-1.2" r="1.7" fill="#1b2430" />
      <circle cx="2.3" cy="-1.2" r="1.7" fill="#1b2430" />
      <path d="M0 1 L-1 3 H1 Z" fill="#1b2430" />
    </g>
  );
}

function Castello({ colore }) {
  return (
    <g fill="#fff">
      <path d="M-6 6 V-5 H-3.5 V-3 H-1.5 V-5 H1.5 V-3 H3.5 V-5 H6 V6 Z" />
      <path d="M-1.6 6 V2 A1.6 1.6 0 0 1 1.6 2 V6 Z" fill={colore} />
    </g>
  );
}

function Obiettivo({ obiettivo, coloreProprietario }) {
  const { tipo, numero, x, y } = obiettivo;
  const colore = tipo === 'home' ? coloreProprietario : tipo === 'central' ? COLORE_CENTRALE : COLORE_ESPANSIONE;
  return (
    <g transform={`translate(${x} ${y})`}>
      {tipo === 'expansion' ? (
        <rect x="-0.8" y="-0.8" width="1.6" height="1.6" transform="rotate(45)" fill={colore} stroke="#fff" strokeWidth="0.12" />
      ) : (
        <circle r="0.95" fill={colore} stroke="#fff" strokeWidth="0.12" />
      )}
      <g transform="scale(0.1)">{tipo === 'home' ? <Castello colore={colore} /> : <Teschio />}</g>
      <circle cx="0.8" cy="-0.8" r="0.42" fill="#111116" stroke="#fff" strokeWidth="0.07" />
      <text x="0.8" y="-0.66" textAnchor="middle" fontSize="0.55" fontWeight="700" fill="#fff">
        {numero}
      </text>
    </g>
  );
}

function Occhio({ occhio }) {
  const separate = occhio.tipo === 'separate';
  const colore = separate ? COLORE_OCCHIO_SEPARATE : COLORE_OCCHIO_SINGOLA;
  return (
    <g transform={`translate(${occhio.x} ${occhio.y})`}>
      <circle r="0.75" fill="rgba(18, 22, 28, 0.85)" stroke={colore} strokeWidth="0.12" />
      <g transform="scale(0.05)">
        <path d="M -8.4 0 Q 0 -6.2 8.4 0 Q 0 6.2 -8.4 0 Z" fill="none" stroke="#fff" strokeWidth="2" />
        <circle r="2.7" fill="#fff" />
        {separate && <line x1="-10.4" y1="10.4" x2="10.4" y2="-10.4" stroke={colore} strokeWidth="3" strokeLinecap="round" />}
      </g>
    </g>
  );
}

// Layout ufficiale scelto in "Force disposition" disegnato sopra il tavolo (e sotto basette e strumenti):
// zone di schieramento, impronte e ruderi dei terreni, obiettivi e, nascondibili con V, quote in pollici e
// icone di visibilità. Solo visuale: non intercetta il mouse. Le zone seguono l'attaccante scelto nel
// tracker (se manca, è il Blu); le coordinate sono in pollici, quindi si adatta alle dimensioni del tavolo.
function LayoutTavolo() {
  const { tavoloRect, selezioneLayout, mostraQuote, alternaQuote } = useTavolo();
  const { stato } = useTracker();
  const id = idLayout(selezioneLayout.giocatore1, selezioneLayout.giocatore2, selezioneLayout.numeroLayout);
  const [caricato, setCaricato] = useState({ id: null, dati: null });

  useEffect(() => {
    if (!id) return undefined;
    let annullato = false;
    caricaLayout(id).then((dati) => {
      if (!annullato) setCaricato({ id, dati });
    });
    return () => {
      annullato = true;
    };
  }, [id]);

  // V mostra/nasconde quote e icone; Ctrl+V (incolla) e simili non contano.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        alternaQuote();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [alternaQuote]);

  const layout = id && caricato.id === id ? caricato.dati : null;
  if (!layout) return null;

  const attaccante = stato.attaccante === 'rosso' ? 'rosso' : 'blu';
  const difensore = attaccante === 'blu' ? 'rosso' : 'blu';
  const coloreRuolo = (ruolo) => COLORE_ESERCITO[ruolo === 'attaccante' ? attaccante : difensore];

  return (
    <svg
      className={styles.layout}
      style={{ left: tavoloRect.left, top: tavoloRect.top, width: tavoloRect.width, height: tavoloRect.height }}
      viewBox={`0 0 ${layout.larghezza} ${layout.altezza}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {layout.zone.map((zona) => (
        <polygon
          key={zona.ruolo}
          className={styles.zona}
          points={aPunti(zona.punti)}
          fill={coloreRuolo(zona.ruolo)}
          stroke={coloreRuolo(zona.ruolo)}
        />
      ))}
      {layout.impronte.map((impronta, i) => (
        <polygon key={i} className={styles.impronta} points={aPunti(impronta.punti)} />
      ))}
      {layout.elementi.map((elemento, i) => (
        <polygon
          key={i}
          className={elemento.categoria === 'DENSE' ? styles.denso : styles.leggero}
          points={aPunti(elemento.punti)}
        />
      ))}
      {mostraQuote && (
        <g>
          {layout.quote.linee.map(([x1, y1, x2, y2], i) => (
            <line key={i} className={styles.quota} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
          {layout.quote.etichette.map((e, i) => (
            <text key={i} className={styles.etichettaQuota} x={e.x} y={e.y}>
              {e.testo}
            </text>
          ))}
          {layout.occhi.map((occhio, i) => (
            <Occhio key={i} occhio={occhio} />
          ))}
        </g>
      )}
      {layout.obiettivi.map((obiettivo) => (
        <Obiettivo
          key={obiettivo.numero}
          obiettivo={obiettivo}
          coloreProprietario={obiettivo.proprietario ? coloreRuolo(obiettivo.proprietario) : COLORE_CENTRALE}
        />
      ))}
    </svg>
  );
}

export default LayoutTavolo;
