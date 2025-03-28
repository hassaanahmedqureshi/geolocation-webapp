import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';

interface MapProps {
    center?: [number, number];
    zoom?: number;
}

type Coordinate = [number, number];
type ReformattedCoordinate = { lat: number; lng: number };

const reformatCoordinates = (coordinates: Coordinate[]): ReformattedCoordinate[] =>
    coordinates.map((coord) => ({ lat: coord[1], lng: coord[0] }));

const addFilledPolygon = (map: maplibregl.Map, polygon: GeoJSON.Feature<GeoJSON.Polygon>) => {
    const polygonId = polygon.id as string;

    if (map.getLayer(`polygon-fill-${polygonId}`)) {
        map.removeLayer(`polygon-fill-${polygonId}`);
    }
    if (map.getSource(`polygon-source-${polygonId}`)) {
        map.removeSource(`polygon-source-${polygonId}`);
    }

    map.addSource(`polygon-source-${polygonId}`, { type: 'geojson', data: polygon });
    map.addLayer({
        id: `polygon-fill-${polygonId}`,
        type: 'fill',
        source: `polygon-source-${polygonId}`,
        paint: { 'fill-color': '#ff0000', 'fill-opacity': 0.5 },
    });
};

const createDrawButton = (startDrawing: () => void) => {
    const drawButton = document.createElement('button');
    drawButton.innerText = 'Start Drawing';
    Object.assign(drawButton.style, {
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: '1000',
    });
    drawButton.onclick = startDrawing;
    return drawButton;
};

const Map: React.FC<MapProps> = ({ center = [12.116505, 42.4174757], zoom = 20 }) => {
    const handleSendCoordinates = async (coordinates: ReformattedCoordinate[]) => {
        const payload = { coordinates };

        fetch('http://lp01.corp.itroteam.com:7200/api/poi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })
            .then((response) => {
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                return response.json();
            })
            .then((data) => {
                console.log('Response from Server:', data); // Log server response here
                return data; // Return the response for further use
            })
            .catch((error) => {
                console.error('Error sending coordinates:', error);
                throw error; // Re-throw the error if needed
            });

    };

    useEffect(() => {
        const map = new maplibregl.Map({
            container: 'map',
            style: `https://api.maptiler.com/maps/streets/style.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`,
            center,
            zoom,
        });

        const draw = new MapboxDraw({
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
                        "line-dasharray": ["literal", [0.2, 2]], // Ensure literal array
                    },
                },
                {
                    id: "gl-draw-polygon-stroke",
                    type: "line",
                    filter: ["all", ["==", "$type", "Polygon"]],
                    layout: { "line-cap": "round", "line-join": "round" },
                    paint: {
                        "line-color": "#D20C0C",
                        "line-width": 2,
                        "line-dasharray": ["literal", [2, 2]], // Ensure literal array
                    },
                },
            ],
        });

        map.on('load', () => {
            const drawButton = createDrawButton(() => draw.changeMode('draw_polygon'));
            document.body.appendChild(drawButton);

            map.addControl(draw as unknown as maplibregl.IControl);
        });

        map.on('draw.create', (event) => {
            const polygon_object = event.features[0];
            const coordinates: Coordinate[] = polygon_object.geometry.coordinates[0];
            const reformattedCoordinates = reformatCoordinates(coordinates);

            handleSendCoordinates(reformattedCoordinates).then((data) => {
                console.log('Coordinates sent successfully: ', data);
            })
                .catch((error) => {
                    console.error('Error while sending coordinates:', error);
                });
            ;
            addFilledPolygon(map, polygon_object as GeoJSON.Feature<GeoJSON.Polygon>);
        });

        return () => {
            map.remove();
            document.querySelectorAll('button').forEach((btn) => btn.remove());
        };
    }, [center, zoom]);

    return <div id="map" style={{ width: '80%', height: '80vh' }} />;
};

export default Map;