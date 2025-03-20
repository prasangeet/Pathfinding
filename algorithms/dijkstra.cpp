#include <iostream>
#include <vector>
#include <queue>
#include <unordered_map>
#include <cmath>
#include <tuple>
#include <limits>
#include <algorithm>
#include <pybind11/pybind11.h>
#include <pybind11/stl.h>

namespace py = pybind11;
using namespace std;

struct Point {
    double x, y;

    bool operator==(const Point& other) const {
        return x == other.x && y == other.y;
    }

    bool operator<(const Point& other) const {
        return tie(x, y) < tie(other.x, other.y);
    }
};

struct PointHash {
    size_t operator()(const Point& p) const {
        return hash<double>()(p.x) ^ (hash<double>()(p.y) << 1);
    }
};

class Graph {
public:
    unordered_map<Point, vector<pair<Point, double>>, PointHash> adjList;

    void addEdge(double lat1, double lng1, double lat2, double lng2, double weight) {
        Point src = {lat1, lng1};
        Point dest = {lat2, lng2};
        adjList[src].push_back({dest, weight});
        adjList[dest].push_back({src, weight});
    }

    py::dict dijkstra(double srcLat, double srcLng, double destLat, double destLng) {
        Point src = {srcLat, srcLng};
        Point dest = {destLat, destLng};

        unordered_map<Point, double, PointHash> distance;
        unordered_map<Point, Point, PointHash> parent;
        priority_queue<pair<double, Point>, vector<pair<double, Point>>, greater<pair<double, Point>>> pq;

        for (auto& node : adjList) {
            distance[node.first] = numeric_limits<double>::infinity();
        }
        distance[src] = 0;
        pq.push({0, src});

        while (!pq.empty()) {
            Point u = pq.top().second;
            pq.pop();

            if (u == dest) break;

            for (auto& neighbor : adjList[u]) {
                Point v = neighbor.first;
                double w = neighbor.second;

                if (distance[v] > distance[u] + w) {
                    distance[v] = distance[u] + w;
                    parent[v] = u;
                    pq.push({distance[v], v});
                }
            }
        }

        if (distance.find(dest) == distance.end() || distance[dest] == numeric_limits<double>::infinity()) {
            py::dict result;
            result["distance"] = -1;
            result["path"] = vector<pair<double, double>>();
            return result;
        }

        vector<pair<double, double>> path;
        for (Point at = dest; parent.find(at) != parent.end(); at = parent[at]) {
            path.push_back({at.x, at.y});
        }
        path.push_back({src.x, src.y});
        reverse(path.begin(), path.end());

        py::dict result;
        result["distance"] = distance[dest];
        result["path"] = path;
        return result;
    }
};

PYBIND11_MODULE(dijkstra, m) {
    py::class_<Graph>(m, "Graph")
        .def(py::init<>())
        .def("addEdge", &Graph::addEdge)
        .def("dijkstra", &Graph::dijkstra);
}
