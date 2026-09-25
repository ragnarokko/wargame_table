import { useState } from 'react';
import { TavoloProvider } from './contexts/TavoloContext';
import { LibreriaProvider } from './contexts/LibreriaContext';
import { TavoloStateProvider } from './contexts/TavoloStateContext';
import PannelloLaterale from './components/PannelloLaterale/PannelloLaterale';
import AreaLavoro from './components/AreaLavoro/AreaLavoro';
import './App.css';

function App() {
  const [righelloAttivo, setRighelloAttivo] = useState(false);

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
