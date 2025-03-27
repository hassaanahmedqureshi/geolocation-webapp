import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';

interface MapProps {
    center?: [number, number]; // [longitude, latitude]
    zoom?: number; // Initial zoom level
}



const Map: React.FC<MapProps> = () => {
    // Define GeoJSON type
    const polygonGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [[
                        [12.1164, 42.4176],  // Top-left
                        [12.1166, 42.4176],  // Top-right
                        [12.1166, 42.4173],  // Bottom-right
                        [12.1164, 42.4173],  // Bottom-left
                        [12.1164, 42.4176]   // Closing the polygon
                    ]]
                },
                properties: {}
            }
        ]
    };

    useEffect(() => {
        const apiKey = process.env.REACT_APP_MAPTILER_API_KEY;

        const map = new maplibregl.Map({
            container: 'map',
            style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
            center: [12.116505, 42.4174757],
            zoom: 20,
        });

        map.on('load', () => {
            console.log('Map loaded successfully');

            // Add marker on the map
            new maplibregl.Marker()
                .setLngLat([12.116505, 42.4174757])
                .addTo(map);

            // Define a polygon area (adjust coordinates to create the shape)
            // const polygonGeoJSON = {
            //     type: 'FeatureCollection',
            //     features: [
            //         {
            //             type: 'Feature',
            //             geometry: {
            //                 type: 'Polygon',
            //                 coordinates: [[
            //                     [12.1164, 42.4176],  // Top-left
            //                     [12.1166, 42.4176],  // Top-right
            //                     [12.1166, 42.4173],  // Bottom-right
            //                     [12.1164, 42.4173],  // Bottom-left
            //                     [12.1164, 42.4176]   // Closing the polygon
            //                 ]]
            //             },
            //             properties: {}
            //         }
            //     ]
            // };
            // Add the polygon source
            map.addSource('marked-area', {
                type: 'geojson',
                data: polygonGeoJSON
            });

            // Add fill layer to show the area
            map.addLayer({
                id: 'marked-area-fill',
                type: 'fill',
                source: 'marked-area',
                layout: {},
                paint: {
                    'fill-color': '#ff0000', // Red fill
                    'fill-opacity': 0.4      // Semi-transparent
                }
            });

            // Add an outline to the polygon
            map.addLayer({
                id: 'marked-area-outline',
                type: 'line',
                source: 'marked-area',
                layout: {},
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 2
                }
            });
        });

    });

    return <div id="map" style={{ width: '80%', height: '80vh' }} />;
};

export default Map;