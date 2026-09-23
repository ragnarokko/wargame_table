import { TavoloProvider } from './contexts/TavoloContext';
import { LibreriaProvider } from './contexts/LibreriaContext';
import { TavoloStateProvider } from './contexts/TavoloStateContext';
import PannelloLaterale from './components/PannelloLaterale/PannelloLaterale';
import AreaLavoro from './components/AreaLavoro/AreaLavoro';
import './App.css';

function App() {
  return (
    <TavoloProvider>
      <LibreriaProvider>
        <TavoloStateProvider>
          <div className="app">
            <PannelloLaterale />
            <AreaLavoro />
          </div>
        </TavoloStateProvider>
      </LibreriaProvider>
    </TavoloProvider>
  );
}

export default App;
