import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import axios from "axios";
import { MapPin, Navigation, LocateFixed, Route } from "lucide-react";
import clsx from "clsx";

const JodhpurMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const routeLayerId = "route-layer";

  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectionMode, setSelectionMode] = useState("source");
  const [sourceMarker, setSourceMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Define the bounds for central Jodhpur
    const bounds = [
      [73.000807, 26.2633995], // Southwest coordinates
      [73.048807, 26.3233995], // Northeast coordinates
    ];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "jodhpur-source": {
            type: "raster",
            tiles: [
              "http://localhost:8080/styles/basic-preview/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "jodhpur-layer",
            type: "raster",
            source: "jodhpur-source",
          },
        ],
      },
      center: [73.024807, 26.2933995],
      zoom: 17,
      minZoom: 16.5,
      maxZoom: 19,
      maxBounds: bounds,
      fitBoundsOptions: {
        padding: 50,
      },
    });

    // Add navigation control
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Restrict panning to bounds
    map.current.on("moveend", () => {
      const center = map.current.getCenter();
      if (!isWithinBounds(center, bounds)) {
        map.current.panTo(getClosestPointWithinBounds(center, bounds), {
          animate: true,
        });
      }
    });

    map.current.on("load", () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Helper functions for bounds checking
  const isWithinBounds = (point, bounds) => {
    return (
      point.lng >= bounds[0][0] &&
      point.lng <= bounds[1][0] &&
      point.lat >= bounds[0][1] &&
      point.lat <= bounds[1][1]
    );
  };

  const getClosestPointWithinBounds = (point, bounds) => {
    return {
      lng: Math.min(Math.max(point.lng, bounds[0][0]), bounds[1][0]),
      lat: Math.min(Math.max(point.lat, bounds[0][1]), bounds[1][1]),
    };
  };

  // Handle map clicks
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleMapClick = (e) => {
      const { lng, lat } = e.lngLat;

      if (selectionMode === "source") {
        if (sourceMarker) sourceMarker.remove();
        const newMarker = new maplibregl.Marker({ color: "#3B82F6" })
          .setLngLat([lng, lat])
          .addTo(map.current);
        setSource({ lng, lat });
        setSourceMarker(newMarker);
      } else {
        if (destinationMarker) destinationMarker.remove();
        const newMarker = new maplibregl.Marker({ color: "#10B981" })
          .setLngLat([lng, lat])
          .addTo(map.current);
        setDestination({ lng, lat });
        setDestinationMarker(newMarker);
      }
    };

    map.current.on("click", handleMapClick);

    return () => {
      map.current?.off("click", handleMapClick);
    };
  }, [mapLoaded, selectionMode, sourceMarker, destinationMarker]);

  // Restore markers when switching modes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (source && !sourceMarker) {
      const newMarker = new maplibregl.Marker({ color: "#3B82F6" })
        .setLngLat([source.lng, source.lat])
        .addTo(map.current);
      setSourceMarker(newMarker);
    }

    if (destination && !destinationMarker) {
      const newMarker = new maplibregl.Marker({ color: "#10B981" })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map.current);
      setDestinationMarker(newMarker);
    }
  }, [mapLoaded, source, destination, sourceMarker, destinationMarker]);

  const findShortestPath = async () => {
    if (!source || !destination) return;
    setLoading(true);

    try {
      const response = await axios.get(
        "http://localhost:8000/api/shortest_path",
        {
          params: {
            source_lat: source.lat,
            source_lng: source.lng,
            dest_lat: destination.lat,
            dest_lng: destination.lng,
          },
        }
      );

      if (response.data.path) {
        const pathCoords = response.data.path.map((p) => [p.lng, p.lat]);

        if (map.current.getLayer(routeLayerId)) {
          map.current.removeLayer(routeLayerId);
          map.current.removeSource(routeLayerId);
        }

        // Add empty GeoJSON source for animation
        map.current.addSource(routeLayerId, {
          type: "geojson",
          data: {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [],
            },
          },
        });

        map.current.addLayer({
          id: routeLayerId,
          type: "line",
          source: routeLayerId,
          paint: {
            "line-color": "#EF4444",
            "line-width": 4,
            "line-opacity": 0.9,
          },
        });

        // Animate route drawing
        animateRoute(pathCoords);
      }
    } catch (error) {
      console.error("Error fetching shortest path:", error);
    } finally {
      setLoading(false);
    }
  };

  const animateRoute = (pathCoords) => {
    let index = 0;
    const totalSteps = pathCoords.length;

    function updateRoute() {
      if (index < totalSteps) {
        const currentPath = pathCoords.slice(0, index + 1);
        map.current.getSource(routeLayerId).setData({
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: currentPath,
          },
        });
        index++;
        requestAnimationFrame(updateRoute);
      }
    }

    updateRoute();
  };

  const resetMap = () => {
    if (sourceMarker) sourceMarker.remove();
    if (destinationMarker) destinationMarker.remove();
    if (map.current?.getLayer(routeLayerId)) {
      map.current.removeLayer(routeLayerId);
      map.current.removeSource(routeLayerId);
    }
    setSource(null);
    setDestination(null);
    setSourceMarker(null);
    setDestinationMarker(null);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full bg-gray-200" />

      <div className="absolute top-5 left-5 p-6 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl z-10 w-80">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Navigation className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">Path Finder</h2>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Select mode and click on the map to set locations
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectionMode("source")}
                className={clsx(
                  "flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                  selectionMode === "source"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                )}
              >
                <MapPin className="w-4 h-4" />
                <span>Source</span>
              </button>

              <button
                onClick={() => setSelectionMode("destination")}
                className={clsx(
                  "flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                  selectionMode === "destination"
                    ? "bg-green-500 text-white"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                )}
              >
                <LocateFixed className="w-4 h-4" />
                <span>Destination</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">
                Source:{" "}
                {source
                  ? `${source.lat.toFixed(4)}, ${source.lng.toFixed(4)}`
                  : "Not set"}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">
                Destination:{" "}
                {destination
                  ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(
                      4
                    )}`
                  : "Not set"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={findShortestPath}
              disabled={!source || !destination || loading}
              className={clsx(
                "flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                !source || !destination || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              <Route className="w-4 h-4" />
              <span>{loading ? "Finding Path..." : "Find Path"}</span>
            </button>

            <button
              onClick={resetMap}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JodhpurMap;
