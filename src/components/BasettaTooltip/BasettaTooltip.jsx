import { useLayoutEffect, useRef, useState } from 'react';
import { nomeEsercito } from '../../config/eserciti';
import { armiPerTemplate, useVersioneDatiArmi } from '../CreazioneEsercito/csvArmiImport';
import AbilitaEstese from '../CreazioneEsercito/AbilitaEstese';
import styles from './BasettaTooltip.module.css';

// RANGE1/2/3 non compaiono più qui: superati dalle armi lette da Datasheets_wargear.csv, che
// mostrano già la gittata di ognuna (vedi la sezione ARMI più sotto).
const CAMPI_STATISTICHE = [
  ['mov', 'MOV'],
  ['res', 'RES'],
  ['w', 'W'],
  ['ts', 'TS'],
  ['tsPiu', 'TS+'],
  ['oc', 'OC'],
  ['fnp', 'FNP'],
];

// interattivo: popup fissato col tasto I (vedi Basetta.jsx), quindi cliccabile: le abilità lunghe e di
// fazione si aprono a tendina. Altrimenti (Ctrl+hover) il popup non riceve il mouse e le mostra solo per nome.
function BasettaTooltip({ template, rotazione = 0, interattivo = false }) {
  const eUnita = Boolean(template.esercito);
  const haDati = Boolean(template.immagine || template.statistiche || eUnita);
  // eUnita non conosce ancora le armi al render (il caricamento CSV, vedi csvArmiImport.js, è
  // asincrono): useVersioneDatiArmi() forza un re-render quando i dati arrivano, così il popup
  // le mostra senza bisogno di chiudere/riaprire.
  useVersioneDatiArmi();
  const armi = eUnita ? armiPerTemplate(template) : [];

  // Se la basetta è nella metà superiore dello schermo, il popup (che di norma si apre verso
  // l'alto) rischia di uscire dalla finestra e apparire tagliato: in quel caso lo si apre invece
  // verso il basso. Una sola misura al montaggio basta, perché il popup compare/scompare ad ogni
  // hover (non resta montato mentre la basetta si sposta).
  const riferimentoRef = useRef(null);
  const [sotto, setSotto] = useState(false);
  const popupRef = useRef(null);
  // Spostamento orizzontale (px a schermo) che riporta il popup dentro l'area visibile: largo com'è
  // (vedi BasettaTooltip.module.css) uscirebbe dal bordo se la basetta sta vicino al margine.
  const [spostamentoX, setSpostamentoX] = useState(0);
  const [scala, setScala] = useState(1);
  useLayoutEffect(() => {
    const rect = riferimentoRef.current?.getBoundingClientRect();
    if (!rect) return;
    setSotto(rect.top + rect.height / 2 < window.innerHeight / 2);

    const popup = popupRef.current;
    if (!popup) return;
    const r = popup.getBoundingClientRect();
    // Limiti: finestra, ristretta al primo antenato che ritaglia (l'area di lavoro, accanto alla barra laterale).
    let sinistra = 0;
    let destra = window.innerWidth;
    for (let el = popup.parentElement; el; el = el.parentElement) {
      const o = getComputedStyle(el).overflowX;
      if (o !== 'visible') {
        const b = el.getBoundingClientRect();
        sinistra = Math.max(sinistra, b.left);
        destra = Math.min(destra, b.right);
        break;
      }
    }
    const margine = 8;
    let dx = 0;
    if (r.left < sinistra + margine) dx = sinistra + margine - r.left;
    else if (r.right > destra - margine) dx = destra - margine - r.right;
    setSpostamentoX(dx);
    // Il popup può essere scalato dallo zoom dell'area: lo spostamento va espresso nel suo sistema locale.
    setScala(popup.offsetWidth > 0 ? r.width / popup.offsetWidth : 1);
  }, []);

  // Il popup è figlio della basetta, che ha una propria rotazione (Q/W): senza contro-rotazione
  // erediterebbe quell'angolo e apparirebbe inclinato/rovesciato. Questo contenitore, stessa
  // dimensione/posizione della basetta e stesso transform-origin (centro), applica la rotazione
  // opposta: la somma delle due annulla esattamente l'effetto, tenendo il popup sempre verticale
  // e ancorato al centro della basetta indipendentemente dalla rotazione corrente.
  return (
    <div ref={riferimentoRef} className={styles.controrotazione} style={{ transform: `rotate(${-rotazione}deg)` }}>
      <div
        ref={popupRef}
        style={spostamentoX ? { translate: `${spostamentoX / scala}px 0` } : undefined}
        className={`${styles.tooltip} ${sotto ? styles.tooltipSotto : ''} ${interattivo ? styles.tooltipInterattivo : ''}`}
        onPointerDown={interattivo ? (e) => e.stopPropagation() : undefined}
        onDoubleClick={interattivo ? (e) => e.stopPropagation() : undefined}
      >
        {template.immagine && <img src={template.immagine} alt={template.nome} className={styles.immagine} />}
        <div className={styles.nome}>{template.nome}</div>
        {eUnita && <div className={styles.esercito}>{nomeEsercito(template.esercito)}</div>}
        {eUnita && (
          <div className={styles.grigliaStatistiche}>
            {CAMPI_STATISTICHE.map(([campo, etichetta]) => (
              <div key={campo} className={styles.cellaStatistica}>
                <span className={styles.etichettaStatistica}>{etichetta}</span>
                <span>{template[campo] || '-'}</span>
              </div>
            ))}
          </div>
        )}
        {eUnita && <div className={styles.note}>NOTE: {template.note || '-'}</div>}
        {template.abilitaEstese?.length > 0 &&
          (interattivo ? (
            <AbilitaEstese abilita={template.abilitaEstese} />
          ) : (
            <div className={styles.note}>
              Altre abilità: {template.abilitaEstese.map((a) => a.nome).join(', ')} (premi I per aprire il testo)
            </div>
          ))}
        {armi.length > 0 && (
          <div className={styles.armi}>
            <div className={styles.armiTitolo}>ARMI</div>
            {armi.map((arma, i) => {
              const gittata = arma.range ? `${arma.range}${arma.tipo === 'Melee' ? '' : '"'}` : '-';
              return (
                <div key={`${arma.arma}-${i}`} className={styles.arma}>
                  <div className={styles.armaLinea}>
                    <span className={styles.armaNome}>{arma.arma}</span>
                    {' — R '}
                    {gittata}
                    {' · A '}
                    {arma.attGrezzo || '-'}
                    {' · BS/WS '}
                    {arma.bsWsGrezzo || '-'}
                    {' · S '}
                    {arma.forzaGrezzo || '-'}
                    {' · AP '}
                    {arma.apGrezzo || '-'}
                    {' · D '}
                    {arma.danniGrezzo || '-'}
                  </div>
                  {arma.descrizione && <div className={styles.armaDescrizione}>{arma.descrizione}</div>}
                </div>
              );
            })}
          </div>
        )}
        {template.statistiche && <pre className={styles.statistiche}>{template.statistiche}</pre>}
        {!haDati && <div className={styles.vuoto}>Nessun dato aggiuntivo</div>}
      </div>
    </div>
  );
}

export default BasettaTooltip;
