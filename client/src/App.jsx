import { ErrorBoundary } from './components/ErrorBoundary';
import MapScene from './components/MapScene';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <MapScene />
      </div>
    </ErrorBoundary>
  );
}

export default App;
