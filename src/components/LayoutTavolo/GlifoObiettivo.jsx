export const COLORE_CENTRALE = '#1f9e84';
export const COLORE_ESPANSIONE = '#2fb457';

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

// Simbolo di un obiettivo (home = castello nel colore del proprietario, central = teschio in cerchio,
// expansion = teschio in rombo) con il numero in un tondino, centrato sull'origine: lo usano sia il tavolo
// (LayoutTavolo) sia le tabelle (viewBox "-1.5 -1.5 3 3").
export function GlifoObiettivo({ tipo, numero, coloreProprietario }) {
  const colore = tipo === 'home' ? coloreProprietario : tipo === 'central' ? COLORE_CENTRALE : COLORE_ESPANSIONE;
  return (
    <>
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
    </>
  );
}
