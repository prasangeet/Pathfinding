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

// Pybind11 module definition
PYBIND11_MODULE(dijkstra, m) {
    py::class_<Graph>(m, "Graph")
        .def(py::init<>())
        .def("addEdge", &Graph::addEdge)
        .def("dijkstra", &Graph::dijkstra);
}
