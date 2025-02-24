## 🗺️ Shortest Path Finding Project Plan

### **1️⃣ Problem Statement**
Finding the most efficient path between two points on a map is a common requirement for navigation systems like Google Maps. Traditional routing algorithms can struggle with performance and accuracy on large datasets or complex networks, leading to inefficient routes and longer travel times.

### **2️⃣ Objective**
The objective of this project is to develop an efficient shortest path finding platform that uses **Dijkstra’s algorithm** to compute the most valid and shortest routes between any two points on a map. The system will leverage **C++** for fast algorithm execution, **Django** for backend management, **PostgreSQL** for data storage, and **Next.js** for an interactive frontend. The platform will visualize routes using **OpenStreetMap** vector tiles.

---

### **3️⃣ Technology Stack**
- **Backend:** Django (Python) + Django REST Framework
  - **Django** is a high-level Python web framework that promotes rapid development and clean, pragmatic design.
  - **Django REST Framework** simplifies the creation of robust and scalable REST APIs.
- **Database:** PostgreSQL (with optional PostGIS for geospatial support)
  - **PostgreSQL** is a powerful open-source relational database system known for its reliability and performance.
  - **PostGIS** adds geospatial capabilities, allowing complex spatial queries and optimizations.
- **Algorithm:** C++ (for Dijkstra's algorithm execution)
  - **C++** offers high-performance computation, essential for running Dijkstra’s algorithm efficiently on large datasets.
- **Frontend:** Next.js + MapLibre GL JS (for OpenStreetMap integration)
  - **Next.js** is a React-based framework that supports server-side rendering and static site generation.
  - **MapLibre GL JS** is an open-source JavaScript library for interactive, customizable vector maps.
- **Map Data:** OpenStreetMap (free vector tiles)
  - **OpenStreetMap** provides free, editable map data that can be used with vector tile renderers like MapLibre.

---

### **4️⃣ Project Workflow**

#### **4.1 Backend Setup (Django + PostgreSQL)**
- **Django:** Set up the backend server, define models, and create RESTful APIs.
- **PostgreSQL:** Store map nodes and edges, with optional PostGIS for spatial queries.
- Initialize Django project and set up virtual environment.
- Configure PostgreSQL database in Django settings.
- Install Django REST Framework and set up CORS.
- Create Django app `maps` for managing nodes (points) and edges (paths).
- Define models:
  - **Node:** Name, Latitude, Longitude
  - **Edge:** Start Node, End Node, Distance
- Run migrations and create API endpoints to manage nodes/edges.

#### **4.2 Algorithm Implementation (C++ for Dijkstra’s Algorithm)**
- **C++:** Implement Dijkstra’s algorithm for optimized pathfinding.
- Expose C++ logic to Django using bindings (e.g., `pybind11`) or create a standalone service.
- Integrate C++ with Django API to process shortest path calculation requests.

#### **4.3 Frontend Setup (Next.js + Map Integration)**
- **Next.js:** Build dynamic pages and integrate with backend APIs.
- **MapLibre GL JS:** Display OpenStreetMap tiles and render paths.
- Initialize Next.js project.
- Install and configure MapLibre GL JS to display OpenStreetMap tiles.
- Build UI components:
  - Map view to display nodes and paths.
  - Search/select interface for choosing start and end points.
  - Route visualization to display the optimal path.
- Connect frontend to Django API to fetch nodes/edges and display optimal paths.

#### **4.4 Database (PostgreSQL)**
- **PostgreSQL:** Design relational schema for map nodes and paths.
- **PostGIS (optional):** Enable geospatial queries for advanced routing features.
- Design schema for nodes and edges.
- Optionally integrate PostGIS for advanced geospatial data handling.

#### **4.5 Final Integration & Deployment**
- **Docker/Heroku:** Deploy backend and manage environments.
- **Vercel/Netlify:** Host the Next.js frontend.
- **AWS RDS (or similar):** Manage PostgreSQL database.
- Integrate frontend, backend, and C++ logic.
- Conduct unit and end-to-end testing.
- Deploy:
  - Backend on Docker/Heroku
  - Frontend on Vercel/Netlify
  - Database on AWS RDS or similar

---

### **5️⃣ Setting Up OpenStreetMap (OSM) in Next.js**

#### **5.1 Install Dependencies**
- Install MapLibre GL JS to render OSM vector tiles:
  ```bash
  npm install maplibre-gl
  ```

#### **5.2 Basic Map Setup**
- Create a reusable map component (`PathMap.js`) to display OSM data:
  ```jsx
  // components/PathMap.js
  import { useEffect, useRef } from 'react';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';

  const PathMap = () => {
    const mapContainer = useRef(null);

    useEffect(() => {
      const map = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://demotiles.maplibre.org/style.json', // Free OSM tiles
        center: [0, 0], // Default center [longitude, latitude]
        zoom: 2, // Default zoom level
      });

      // Add navigation controls (zoom in/out, rotation)
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      return () => map.remove(); // Cleanup on unmount
    }, []);

    return (
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '600px' }}
      />
    );
  };

  export default PathMap;
  ```

#### **5.3 Integrate Map in Next.js Page**
- Use the `PathMap` component inside a Next.js page (e.g., `pages/index.js`):
  ```jsx
  import PathMap from '../components/PathMap';

  export default function Home() {
    return (
      <div>
        <h1 className="text-2xl font-bold text-center my-4">Shortest Path Finder</h1>
        <PathMap />
      </div>
    );
  }
  ```

- Run the Next.js app:
  ```bash
  npm run dev
  ```

#### **5.4 Next Steps (Enhancements)**
- **Add Markers:** Plot nodes (points) on the map.
- **Draw Paths:** Visualize routes using `map.addSource` and `map.addLayer`.
- **Interactivity:** Enable clickable markers and dynamic route highlighting.

---

### **6️⃣ Expected Outcomes**
- A fully functional shortest path finding platform.
- Interactive map displaying nodes and optimized paths.
- Efficient path calculations using Dijkstra’s algorithm.
- Seamless integration between frontend, backend, and C++ logic.

### **7️⃣ Potential Enhancements**
- Real-time path updates based on traffic or closures.
- User authentication and personalized route preferences.
- Integration with geospatial data for more accurate mapping.
- Mobile app version for on-the-go navigation.

---

This plan outlines the core structure and workflow for building a scalable and efficient shortest path finding system using Dijkstra's algorithm and modern web technologies.

