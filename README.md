# Shortest Path Finding Project

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

### Step 3: Write and Compile the C++ Code
Create a `dijkstra.cpp` file with the following content:
```cpp
#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
#include <limits>
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

namespace py = pybind11;
using namespace std;

class Graph {
public:
    unordered_map<string, vector<pair<string, int>>> adjList;

    void addEdge(const string& src, const string& dest, int weight) {
        adjList[src].push_back({dest, weight});
        adjList[dest].push_back({src, weight});
    }

    py::dict dijkstra(const string& src) {
        unordered_map<string, int> distance;
        priority_queue<pair<int, string>, vector<pair<int, string>>, greater<pair<int, string>>> pq;

        for (auto& node : adjList) {
            distance[node.first] = numeric_limits<int>::max();
        }
        distance[src] = 0;
        pq.push({0, src});

        while (!pq.empty()) {
            string u = pq.top().second;
            pq.pop();

            for (auto& neighbor : adjList[u]) {
                string v = neighbor.first;
                int w = neighbor.second;

                if (distance[v] > distance[u] + w) {
                    distance[v] = distance[u] + w;
                    pq.push({distance[v], v});
                }
            }
        }

        py::dict py_distance;
        for (const auto& [key, value] : distance) {
            py_distance[key.c_str()] = value;
        }
        return py_distance;
    }
};

PYBIND11_MODULE(dijkstra, m) {
    py::class_<Graph>(m, "Graph")
        .def(py::init<>())
        .def("addEdge", &Graph::addEdge)
        .def("dijkstra", &Graph::dijkstra);
}
```

### Step 4: Create a `setup.py` to Compile the Module
```python
from setuptools import setup, Extension
import pybind11

ext_modules = [
    Extension(
        'dijkstra',
        ['dijkstra.cpp'],
        include_dirs=[pybind11.get_include()],
        language='c++',
    )
]

setup(
    name='dijkstra',
    version='0.0.1',
    ext_modules=ext_modules,
    zip_safe=False,
)
```

### Step 5: Build the Module
Run:
```bash
python setup.py build_ext --inplace
```

### Step 6: Test the Module
```python
import dijkstra

graph = dijkstra.Graph()
graph.addEdge("A", "B", 4)
graph.addEdge("A", "C", 2)
graph.addEdge("B", "C", 5)
graph.addEdge("B", "D", 10)
graph.addEdge("C", "D", 3)

result = graph.dijkstra("A")
print(result)
```

If everything is set up correctly, the shortest path results should print successfully.

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

