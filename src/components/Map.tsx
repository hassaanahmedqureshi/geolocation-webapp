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
    const polygonId = polygon.properties?.id as string;
    //
    // if (!polygonId) {
    //     console.error('Polygon is missing a unique id:', polygon);
    //     return;
    // }

    // Use unique IDs for sources and layers based on the polygon's id
    const sourceId = `polygon-source-${polygonId}`;
    const layerId = `polygon-fill-${polygonId}`;

    // Remove the source and layer if already exists (to avoid conflicts)
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
    }

    // Add the GeoJSON source for the polygon
    map.addSource(sourceId, { type: 'geojson', data: polygon });

    // Add the fill layer for the polygon with the unique id
    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
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
        padding: '10px 15px',
        backgroundColor: '#009452',
        color: '#ffffff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    });
    drawButton.onclick = startDrawing;
    return drawButton;
};

const createDeleteButton = (deleteAllPolygons: () => Promise<void>) => {
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Delete All Polygons';
    Object.assign(deleteButton.style, {
        position: 'absolute',
        top: '50px', // Place it below the "Start Drawing" button for better UI
        left: '10px',
        zIndex: '1000',
        padding: '10px 15px',
        backgroundColor: '#a50505',
        color: '#ffffff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
    });
    deleteButton.onclick = async () => {
        const confirmation = window.confirm('Are you sure you want to delete all polygons? This action cannot be undone.');
        if (confirmation) {
            await deleteAllPolygons();
        }
    };
    return deleteButton;
};

const fetchCoordinates = async () => {
    try {
        const response = await fetch('http://lp01.corp.itroteam.com:7200/api/poi', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`Error fetching coordinates: ${response.status}`);
        }

        const data = await response.json(); // Parse the response as JSON
        console.log('Fetched Coordinates from Server:', data); // Log the fetched coordinates

        return data; // Return the fetched data for further use
    } catch (error) {
        console.error('Error while fetching coordinates:', error);
    }
};

const deleteAllPolygons = async (): Promise<void> => {
    const endpoint = 'http://lp01.corp.itroteam.com:7200/api/poi';

    try {
        const response = await fetch(endpoint, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('All polygons have been deleted successfully.');
            alert('All polygons have been deleted successfully.');
        } else {
            console.error(`Failed to delete polygons. Status: ${response.status}`);
            alert(`Failed to delete polygons. Status: ${response.status}`);
        }
    } catch (error) {
        console.error('An error occurred while deleting all polygons:', error);
        alert('An error occurred while deleting all polygons. Check the console for more details.');
    }
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

        map.on('load', async () => {
            const drawButton = createDrawButton(() => draw.changeMode('draw_polygon'));
            document.getElementById('map')?.appendChild(drawButton);
            // fetchCoordinates();
            map.addControl(draw as unknown as maplibregl.IControl);

            try {
                const serverData = await fetchCoordinates();

                console.log('Fetched Data from Server:', serverData);

                if (serverData && serverData.data) {
                    serverData.data.forEach((item: any, index: number) => {
                        try {
                            // Transform coordinates if they are objects with {lng, lat}
                            const transformCoordinates = (coordinates: { lng: number; lat: number }[]): number[][] => {
                                return coordinates.map(point => [point.lng, point.lat]);
                            };

                            // Transform and wrap the coordinates for GeoJSON
                            const formattedCoordinates = [transformCoordinates(item.coordinates)];

                            // Ensure the polygon is closed
                            const closePolygon = (coords: number[][]): number[][] => {
                                if (
                                    coords[0][0] !== coords[coords.length - 1][0] ||
                                    coords[0][1] !== coords[coords.length - 1][1]
                                ) {
                                    coords.push(coords[0]); // Close the ring
                                }
                                return coords;
                            };

                            const fixedCoordinates = formattedCoordinates.map(closePolygon);

                            // Create a unique id if one is missing
                            const uniqueId = item.id || `polygon-${index}`;

                            // Create the GeoJSON feature
                            const polygonFeature: GeoJSON.Feature<GeoJSON.Polygon> = {
                                type: 'Feature',
                                geometry: {
                                    type: 'Polygon',
                                    coordinates: fixedCoordinates,
                                },
                                properties: { id: uniqueId }, // Add a unique id to distinguish polygons
                            };

                            console.log('Processed Polygon Feature:', polygonFeature);

                            // Add the polygon to the map
                            addFilledPolygon(map, polygonFeature);
                        } catch (err) {
                            console.error('Error processing polygon:', item, err);
                        }
                    });
                }
                else {
                    console.error('No data found in the server response.');
                }
            }

            catch (error) {
                console.error('Error adding polygons:', error);
            }

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

        // Append the delete button to the map container
        const deleteButton = createDeleteButton(deleteAllPolygons);
        document.getElementById('map')?.appendChild(deleteButton);


        return () => {
            map.remove();
            document.querySelectorAll('button').forEach((btn) => btn.remove());
        };
    }, [center, zoom]);

    return <div id="map" style={{ width: '80%', height: '80vh' }} />;
};

export default Map;