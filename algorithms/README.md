# Dijkstra's Algorithm Python Module (via pybind11)

This project implements Dijkstra's algorithm in C++ and exposes it as a Python module using **pybind11**. The build system is managed using **CMake**.

## Prerequisites

Ensure you have the following installed on your system:
- **CMake** (version 3.15 or higher)
- **Python** (with development headers)
- **GCC/Clang/MSVC** (a C++17 compatible compiler)
- **pybind11** (installed via FetchContent in CMake)

## CMake Configuration

Create a `CMakeLists.txt` file with the following content:

```cmake
cmake_minimum_required(VERSION 3.15)
project(dijkstra_module)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find Python
find_package(Python COMPONENTS Interpreter Development REQUIRED)

# Include pybind11
include(FetchContent)
FetchContent_Declare(
  pybind11
  GIT_REPOSITORY https://github.com/pybind/pybind11.git
  GIT_TAG        v2.11.1  # Adjust this to a stable version
)
FetchContent_MakeAvailable(pybind11)

# Add the pybind11 module
pybind11_add_module(dijkstra dijkstra.cpp)
```

## Installation Instructions

### Step 1: Clone the Repository
```sh
git clone https://github.com/your-repo/pathfinding.git
cd pathfinding
```

### Step 2: Create a Build Directory
```sh
mkdir build && cd build
```

### Step 3: Configure and Build
#### On Linux/macOS:
```sh
cmake ..
cmake --build . --config Release
```

#### On Windows (Using MSVC):
```sh
cmake .. -G "Visual Studio 17 2022"
cmake --build . --config Release
```

### Step 4: Use the Python Module

After building, a `.pyd` or `.so` module will be created. To use it in Python:

```python
import dijkstra

graph = dijkstra.Graph()
graph.addEdge("A", "B", 3)
graph.addEdge("A", "C", 1)
graph.addEdge("C", "B", 1)
graph.addEdge("B", "D", 2)
graph.addEdge("C", "D", 3)

result = graph.dijkstra("A")
print(result)  # Output: {'A': 0, 'B': 2, 'C': 1, 'D': 4}
```

## Notes
- `setup.py` has been removed since CMake now handles the build process.
- Ensure that your Python environment matches the C++ compiler you use.
- If you encounter issues with Python headers, install development packages (`python3-dev` on Linux or use the official Python installer on Windows with development headers enabled).

Happy coding! 🚀
