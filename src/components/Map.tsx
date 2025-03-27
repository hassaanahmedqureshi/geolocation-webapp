import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface MapProps {
    center?: [number, number]; // [longitude, latitude]
    zoom?: number; // Initial zoom level
}

const Map: React.FC<MapProps> = ({ center = [12.116505, 42.4174757], zoom = 20 }) => {
    useEffect(() => {
        const apiKey = process.env.REACT_APP_MAPTILER_API_KEY;

        if (!apiKey) {
            console.error('MapTiler API key is missing in the .env file.');
            return;
        }

        try {
            const map = new maplibregl.Map({
                container: 'map', // HTML element ID for the map container
                style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
                center: center,
                zoom: zoom,
            });

            map.on('load', () => {
                console.log('Map loaded successfully');
            });

            map.on('error', (e) => {
                console.error('Map error:', e.error);
            });

            // Cleanup the map instance when the component unmounts
            return () => map.remove();
        } catch (err) {
            console.error('Map initialization error:', err);
        }
    }, [center, zoom]);

    return <div id="map"  style={{ width: '80%', height: '80vh' }} />;
};

export default Map;