import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
print(BASE_DIR)
ALGORITHM_DIR = os.path.abspath(os.path.join(BASE_DIR, 'algorithms', 'build', 'Release'))

sys.path.append(ALGORITHM_DIR)
print(sys.path)


import dijkstra 


g = dijkstra.Graph()

# Add edges
g.addEdge("A", "B", 4)
g.addEdge("A", "C", 1)
g.addEdge("C", "B", 2)
g.addEdge("B", "D", 1)

# Run Dijkstra's algorithm
result = g.dijkstra("A")

# Print the shortest distances
print(result)
