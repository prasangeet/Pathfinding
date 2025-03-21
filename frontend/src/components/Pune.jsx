import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import axios from "axios";
import { MapPin, LocateFixed, Route, Car, Bike, PersonStanding, LocateIcon } from "lucide-react";
import clsx from "clsx";

const PuneMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const routeLayerId = "route-layer";
  const carRouteLayerId = "car-route-layer";

  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectionMode, setSelectionMode] = useState("source");
  const [sourceMarker, setSourceMarker] = useState(null);
  const [destinationMarker, setDestinationMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState([]);
  const [closestCar, setClosestCar] = useState(null);
  const [carMarkers, setCarMarkers] = useState([]);
  const [carRouteDistance, setCarRouteDistance] = useState(null);
  const [routeDistance, setRouteDistance] = useState(null);

  // Travel speeds in meters per second
  const travelSpeeds = {
    car: (30 * 1000) / 3600, // 30 km/h in m/s
    bike: (15 * 1000) / 3600, // 15 km/h in m/s
    walk: (5 * 1000) / 3600, // 5 km/h in m/s
  };

  // Calculate travel time in minutes
  const calculateTravelTime = (distance, speed) => {
    if (!distance) return null;
    return Math.round((distance / speed) / 60); // Convert seconds to minutes
  };

  // Format distance for display
  const formatDistance = (meters) => {
    if (!meters) return "N/A";
    return meters >= 1000
      ? `${(meters / 1000).toFixed(1)} km`
      : `${Math.round(meters)} m`;
  };

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Define the bounds for central Pune
    const bounds = [
      [73.555, 18.415], // Southwest coordinates
      [74.2, 18.786], // Northeast coordinates
    ];

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "pune-source": {
            type: "raster",
            tiles: [
              "http://localhost:8080/styles/basic-preview/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "pune-layer",
            type: "raster",
            source: "pune-source",
          },
        ],
      },
      center: [73.8560, 18.5115],
      zoom: 15,
      maxBounds: bounds,
      fitBoundsOptions: {
        padding: 50,
      },
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    map.current.on("moveend", () => {
      const center = map.current.getCenter();
      if (!isWithinBounds(center, bounds)) {
        map.current.panTo(getClosestPointWithinBounds(center, bounds), {
          animate: true,
        });
      }
    });

    map.current.on("load", () => {
      map.current.loadImage("/car-economy.png", (error, image) => {
        if (error) throw error;
        if (!map.current.hasImage("car-icon")) {
          map.current.addImage("car-icon", image);
        }
      });
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
        setRouteDistance(null);
      } else {
        if (destinationMarker) destinationMarker.remove();
        const newMarker = new maplibregl.Marker({ color: "#10B981" })
          .setLngLat([lng, lat])
          .addTo(map.current);
        setDestination({ lng, lat });
        setDestinationMarker(newMarker);
        setRouteDistance(null);
      }
    };

    map.current.on("click", handleMapClick);

    return () => {
      map.current?.off("click", handleMapClick);
    };
  }, [mapLoaded, selectionMode, sourceMarker, destinationMarker]);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Find shortest path between source and destination
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

        // Calculate total distance
        const distance = calculateDistance(
          source.lat,
          source.lng,
          destination.lat,
          destination.lng
        );
        setRouteDistance(distance);

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

      // Fallback if API fails: direct line between source and destination
      if (map.current.getLayer(routeLayerId)) {
        map.current.removeLayer(routeLayerId);
        map.current.removeSource(routeLayerId);
      }

      const distance = calculateDistance(
        source.lat,
        source.lng,
        destination.lat,
        destination.lng
      );
      setRouteDistance(distance);

      map.current.addSource(routeLayerId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [source.lng, source.lat],
              [destination.lng, destination.lat],
            ],
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

    if (map.current?.getLayer(carRouteLayerId)) {
      map.current.removeLayer(carRouteLayerId);
      map.current.removeSource(carRouteLayerId);
    }

    setSource(null);
    setDestination(null);
    setSourceMarker(null);
    setDestinationMarker(null);
    setClosestCar(null);
    setCarRouteDistance(null);
    setRouteDistance(null);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full bg-gray-200" />

      <div className="absolute top-5 left-5 p-6 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl z-10 w-96">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <LocateIcon className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Pathfinding Visualizer
            </h2>
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

            {routeDistance && (
              <div className="mt-4 space-y-3 border-t pt-3">
                <h3 className="font-medium text-gray-700">Route Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Distance:</span>
                    <span className="font-medium">{formatDistance(routeDistance)}</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-600">By Car</span>
                      </div>
                      <span className="font-medium">
                        {calculateTravelTime(routeDistance, travelSpeeds.car)} mins
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Bike className="w-4 h-4 text-green-600" />
                        <span className="text-gray-600">By Bike</span>
                      </div>
                      <span className="font-medium">
                        {calculateTravelTime(routeDistance, travelSpeeds.bike)} mins
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <PersonStanding className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-600">Walking</span>
                      </div>
                      <span className="font-medium">
                        {calculateTravelTime(routeDistance, travelSpeeds.walk)} mins
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={findShortestPath}
              disabled={!source || !destination || loading}
              className={clsx(
                "flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                !source || !destination || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-red-500 text-white hover:bg-red-600"
              )}
            >
              <Route className="w-4 h-4" />
              <span>
                {loading ? "Finding Route..." : "Find Route to Destination"}
              </span>
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

export default PuneMap;