import React, {useEffect} from 'react';
import './App.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import Map from './components/Map';



function App() {

  useEffect(() => {
    const apiKey = process.env.REACT_APP_MAPTILER_API_KEY;

    if (!apiKey) {
      console.error('MapTiler API key is missing in the .env file.');
      return;
    }


    try {
      const map = new maplibregl.Map({
        container: 'map', // container id
        style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`, // style URL
        center: [12.116505, 42.4174757], // starting position [lng, lat]
        zoom: 20, // approximate zoom level for 866 meters altitude
      });

      map.on('load', () => {
        console.log('Map loaded successfully');
      });

      map.on('error', (e) => {
        console.error('Map error:', e.error);
      });

      // Optional cleanup
      return () => map.remove();
    } catch (err) {
      console.error('Map initialization error:', err);
    }
  }, []);


  return (
    <div className="App">
      <header className="App-header">
        <h1>Geolocation Web App</h1>
        <Map center={[12.116505, 42.4174757]} zoom={15} />


      </header>
    </div>
  );
}

export default App;
