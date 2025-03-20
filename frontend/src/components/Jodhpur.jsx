"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import axios from "axios";
import { MapPin, LocateFixed, Route, Car } from "lucide-react";
import clsx from "clsx";

const JodhpurMap = () => {
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

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Define the bounds for central Jodhpur
    const bounds = [
      [73.0161, 26.288], // Southwest coordinates
      [73.031, 26.2988], // Northeast coordinates
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
      // minZoom: 16.5,
      // maxZoom: 19,
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
      map.current.loadImage("/car-economy.png", (error, image) => {
        if (error) throw error;
        if (!map.current.hasImage("car-icon")) {
          map.current.addImage("car-icon", image);
        }
      });

      setMapLoaded(true);
      generateRandomCars(bounds);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Generate random cars within map bounds
  const generateRandomCars = (bounds) => {
    const randomCars = [];
    const numCars = 25; // Increased number of cars for better visibility

    for (let i = 0; i < numCars; i++) {
      // Generate random coordinates within bounds
      const lng = bounds[0][0] + Math.random() * (bounds[1][0] - bounds[0][0]);
      const lat = bounds[0][1] + Math.random() * (bounds[1][1] - bounds[0][1]);

      randomCars.push({
        id: `car-${i}`,
        lng,
        lat,
        type: "UberX",
        image: "/car-economy.png", // Only using economy cars
        // Random rotation angle (0-360 degrees)
        rotation: Math.floor(Math.random() * 360),
      });
    }

    setCars(randomCars);
  };

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

        // Find closest car when source is set
        findClosestCar({ lng, lat });
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
  }, [mapLoaded, selectionMode, sourceMarker, destinationMarker, cars]);

  // Add car markers to map
  useEffect(() => {
    if (!map.current || !mapLoaded || cars.length === 0) return;

    // Remove existing car markers
    carMarkers.forEach((marker) => marker.remove());

    const newCarMarkers = cars.map((car) => {
      // Create a custom element for the car marker
      const el = document.createElement("div");
      el.className = "car-marker";
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.backgroundImage = `url(${car.image})`;
      el.style.backgroundSize = "contain";
      el.style.backgroundRepeat = "no-repeat";
      el.style.transform = `rotate(${car.rotation}deg)`;

      // Create and add the marker
      const marker = new maplibregl.Marker({
        element: el,
        rotation: car.rotation,
      })
        .setLngLat([car.lng, car.lat])
        .addTo(map.current);

      return marker;
    });

    setCarMarkers(newCarMarkers);
  }, [cars, mapLoaded]);

  // Draw route to closest car when found
  useEffect(() => {
    if (!closestCar || !map.current || !source) return;

    // Remove existing car route if any
    if (map.current.getLayer(carRouteLayerId)) {
      map.current.removeLayer(carRouteLayerId);
      map.current.removeSource(carRouteLayerId);
    }

    // Add route from source to closest car
    map.current.addSource(carRouteLayerId, {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [source.lng, source.lat],
            [closestCar.lng, closestCar.lat],
          ],
        },
      },
    });

    map.current.addLayer({
      id: carRouteLayerId,
      type: "line",
      source: carRouteLayerId,
      paint: {
        "line-color": "#8B5CF6", // Purple color for car route
        "line-width": 4,
        "line-opacity": 0.9,
        "line-dasharray": [2, 1], // Dashed line
      },
    });

    // Calculate and store the distance to the car
    const distance = calculateDistance(
      source.lat,
      source.lng,
      closestCar.lat,
      closestCar.lng
    );
    setCarRouteDistance(distance);
  }, [closestCar, source]);

  // Find the closest car to a given point
  const findClosestCar = (point) => {
    if (!cars.length) return;

    let closest = null;
    let minDistance = Number.POSITIVE_INFINITY;

    cars.forEach((car) => {
      const distance = calculateDistance(
        point.lat,
        point.lng,
        car.lat,
        car.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = car;
      }
    });

    setClosestCar(closest);
  };

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

    // Remove route layers
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

    // Regenerate random cars
    const bounds = [
      [73.000807, 26.2633995],
      [73.048807, 26.3233995],
    ];
    generateRandomCars(bounds);
  };

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="w-full h-full bg-gray-200" />

      <div className="absolute top-5 left-5 p-6 bg-white/95 backdrop-blur-sm shadow-xl rounded-xl z-10 w-80">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Car className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Uber-like Ride Finder
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
                <span>Pickup</span>
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
                <span>Dropoff</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">
                Pickup:{" "}
                {source
                  ? `${source.lat.toFixed(4)}, ${source.lng.toFixed(4)}`
                  : "Not set"}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-600">
                Dropoff:{" "}
                {destination
                  ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(
                      4
                    )}`
                  : "Not set"}
              </span>
            </div>

            {closestCar && (
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-600">
                  Closest car:{" "}
                  {carRouteDistance
                    ? `${carRouteDistance.toFixed(0)}m away`
                    : "calculating..."}
                </span>
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

export default JodhpurMap;
