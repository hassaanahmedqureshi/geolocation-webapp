import React from 'react';
import './App.css';
import 'maplibre-gl/dist/maplibre-gl.css';

import Map from './components/Map';



function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Geolocation Web App</h1>
        <div id={'test'}></div>
        <Map center={[12.116505, 42.4174757]} zoom={15} />


      </header>
    </div>
  );
}

export default App;
