# Shortest Path Finding Project

## Folder Structure
```
project_root/
│── backend/            # Django Backend
|   |── shortest_path
|   │   ├── manage.py       # Django project manager
|   │   ├── backend/        # Django app
|   │   ├── routes/         # Django routes app
|   │   │   ├── models.py   # Database models
|   │   │   ├── views.py    # API views
|   │   ├── dijkstra/       # Compiled C++ module
│── frontend/           # Next.js Frontend
│   ├── components/     # React components
│   ├── pages/          # Next.js pages
│── algorithm/          # C++ Dijkstra Algorithm
│   ├── dijkstra.cpp    # C++ implementation
│   ├── setup.py        # Pybind11 setup
│── docs/               # Documentation
│── README.md           # Project documentation
```

## Installation Process for Pybind and Python

### Step 1: Install Python and Required Dependencies
Ensure you have Python installed. You can download it from [python.org](https://www.python.org/). Then install `pybind11`:
```bash
pip install pybind11
```

Alternatively, if using MinGW or MSVC, install Python and dependencies using:
```bash
pacman -S pybind11 python python-devel python-pip
```

### Step 2: Setup Pybind11 with C++
If you haven’t installed a C++ compiler, install `mingw-w64` (for Windows) or use `g++` (Linux/macOS).
```bash
# On Linux/macOS
sudo apt install g++

# On Windows (via Chocolatey)
choco install mingw
```

### Step 3: Setup cmake
Read doc/setup-cmake.md

---

## 🗺️ Shortest Path Finding Project Plan

### 1️⃣ Problem Statement
Finding the most efficient path between two points on a map is crucial for navigation systems. Large datasets require optimized algorithms to compute routes efficiently.

### 2️⃣ Objective
Develop a platform using **Dijkstra’s algorithm** to compute the most valid and shortest routes. The system will use **C++** for computation, **Django** for backend, **PostgreSQL** for data storage, and **Next.js** for frontend. **OpenStreetMap** vector tiles will be used for visualization.

---

### 3️⃣ Technology Stack
- **Backend:** Django + Django REST Framework
- **Database:** PostgreSQL (+ PostGIS for geospatial queries)
- **Algorithm:** C++ (Dijkstra’s algorithm)
- **Frontend:** Next.js + MapLibre GL JS
- **Map Data:** OpenStreetMap (free vector tiles)

---

### 4️⃣ Project Workflow

#### 4.1 Backend Setup
- Setup Django with PostgreSQL
- Define models for nodes (points) and edges (paths)
- Create Django API endpoints for managing routes

#### 4.2 Algorithm Implementation
- Implement Dijkstra’s algorithm in C++
- Expose C++ logic using `pybind11`
- Integrate with Django backend

#### 4.3 Frontend Setup
- Use Next.js for UI
- Display maps with MapLibre GL JS
- Create components for selecting start and end points

#### 4.4 Database
- Use PostgreSQL for storing nodes and edges
- Optionally integrate PostGIS for geospatial queries

#### 4.5 Deployment
- **Backend:** Docker/Heroku
- **Frontend:** Vercel/Netlify
- **Database:** AWS RDS (or similar)

---

### 5️⃣ Setting Up OpenStreetMap (OSM) in Next.js

#### 5.1 Install Dependencies
```bash
npm install maplibre-gl
```

#### 5.2 Basic Map Setup
Create a reusable map component (`PathMap.js`):
```jsx
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const PathMap = () => {
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [0, 0],
      zoom: 2,
    });
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    return () => map.remove();
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '600px' }} />;
};

export default PathMap;
```
