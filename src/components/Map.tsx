import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

interface MapProps {
    center?: [number, number];
    zoom?: number;
}

const Map: React.FC<MapProps> = () => {
    useEffect(() => {
        const apiKey = process.env.REACT_APP_MAPTILER_API_KEY;

        const map = new maplibregl.Map({
            container: 'map',
            style: `https://api.maptiler.com/maps/streets/style.json?key=${apiKey}`,
            center: [12.116505, 42.4174757],
            zoom: 20,
        });

        const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: { polygon: true, trash: true },
            styles: [
                {
                    id: "gl-draw-line",
                    type: "line",
                    filter: ["all", ["==", "$type", "LineString"]],
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": "#D20C0C",
                        "line-width": 2,
                        "line-dasharray": ["literal", [0.2, 2]]
                    }
                },
                {
                    id: "gl-draw-polygon-stroke",
                    type: "line",
                    filter: ["all", ["==", "$type", "Polygon"]],
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": "#D20C0C",
                        "line-width": 2,
                        "line-dasharray": ["literal", [2, 2]]
                    }
                }
            ]
        });

        map.on('load', () => {
            console.log('Map loaded successfully');

            new maplibregl.Marker()
                .setLngLat([12.116505, 42.4174757])
                .addTo(map);

            map.addControl(draw as unknown as maplibregl.IControl, 'top-left');

            // Add Predefined Polygon
            const polygonGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Geometry> = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [12.1164, 42.4176],
                                [12.1166, 42.4176],
                                [12.1166, 42.4173],
                                [12.1164, 42.4173],
                                [12.1164, 42.4176]
                            ]]
                        },
                        properties: {}
                    }
                ]
            };

            map.addSource('marked-area', {
                type: 'geojson',
                data: polygonGeoJSON
            });

            map.addLayer({
                id: 'marked-area-fill',
                type: 'fill',
                source: 'marked-area',
                layout: {},
                paint: {
                    'fill-color': '#ff0000',
                    'fill-opacity': 0.4
                }
            });

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

        // Function to fill user-drawn polygons
        const addFilledPolygon = (polygon: GeoJSON.Feature<GeoJSON.Polygon>) => {
            const polygonId = polygon.id as string;

            if (map.getLayer(`polygon-fill-${polygonId}`)) {
                map.removeLayer(`polygon-fill-${polygonId}`);
            }
            if (map.getSource(`polygon-source-${polygonId}`)) {
                map.removeSource(`polygon-source-${polygonId}`);
            }

            map.addSource(`polygon-source-${polygonId}`, {
                type: 'geojson',
                data: polygon
            });

            map.addLayer({
                id: `polygon-fill-${polygonId}`,
                type: 'fill',
                source: `polygon-source-${polygonId}`,
                paint: {
                    'fill-color': '#ff0000',
                    'fill-opacity': 0.5
                }
            });
        };

        // Event: When user completes drawing a polygon
        map.on('draw.create', (event) => {
            console.log("Polygon drawn:", event.features[0]);

            const polygon = event.features[0] as GeoJSON.Feature<GeoJSON.Polygon>;

            document.addEventListener('keydown', (e) => {
                if (e.key === "Enter") {
                    addFilledPolygon(polygon);
                }
            }, { once: true });
        });

        const startDrawing = () => draw.changeMode('draw_polygon');

        const drawButton = document.createElement('button');
        drawButton.innerText = "Start Drawing";
        drawButton.style.position = "absolute";
        drawButton.style.top = "10px";
        drawButton.style.left = "10px";
        drawButton.style.zIndex = "1000";
        drawButton.onclick = startDrawing;
        document.body.appendChild(drawButton);
    }, []);

    return <div id="map" style={{ width: '80%', height: '80vh' }} />;
};

export default Map;
