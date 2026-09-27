import { useEffect, useState } from 'react';
import { TavoloProvider } from './contexts/TavoloContext';
import { LibreriaProvider } from './contexts/LibreriaContext';
import { TavoloStateProvider } from './contexts/TavoloStateContext';
import PannelloLaterale from './components/PannelloLaterale/PannelloLaterale';
import AreaLavoro from './components/AreaLavoro/AreaLavoro';
import './App.css';

function App() {
  const [righelloAttivo, setRighelloAttivo] = useState(false);

  // D attiva/disattiva lo strumento righello, in aggiunta al pulsante nel menu laterale
  // (stesso stato, quindi stesso comportamento: nessuna differenza tra le due vie).
  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setRighelloAttivo((a) => !a);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <TavoloProvider>
      <LibreriaProvider>
        <TavoloStateProvider>
          <div className="app">
            <PannelloLaterale
              righelloAttivo={righelloAttivo}
              onToggleRighello={() => setRighelloAttivo((a) => !a)}
            />
            <AreaLavoro righelloAttivo={righelloAttivo} />
          </div>
        </TavoloStateProvider>
      </LibreriaProvider>
    </TavoloProvider>
  );
}

export default App;
