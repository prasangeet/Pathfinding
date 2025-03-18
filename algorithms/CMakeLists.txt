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