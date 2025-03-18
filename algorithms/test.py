import dijkstra

# Create a graph object
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
