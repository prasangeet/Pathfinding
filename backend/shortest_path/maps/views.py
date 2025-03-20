from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Node, Edge
import os
import sys

# Add the absolute path directly
MODULE_PATH = "D:/Projects/pathfinding/algorithms/build/Release"
if MODULE_PATH not in sys.path:
    sys.path.insert(0, MODULE_PATH)  # Add at the beginning of sys.path

# Debug information
print(f"Python path: {sys.path}")
print(f"Looking for module at: {MODULE_PATH}")
print(f"Directory contents: {os.listdir(MODULE_PATH)}")

try:
    import dijkstra
    print("Successfully imported dijkstra")
except ImportError as e:
    print(f"Failed to import dijkstra: {e}")
    print(f"Detailed error: {str(e)}")
    raise

@api_view(['GET'])
def shortest_path(request):
    try:
        source_lat = float(request.GET.get('source_lat'))
        source_lng = float(request.GET.get('source_lng'))
        dest_lat = float(request.GET.get('dest_lat'))
        dest_lng = float(request.GET.get('dest_lng'))
    except (TypeError, ValueError):
        return Response({"error": "Invalid coordinates"}, status=400)

    # Find the closest node to the given source and destination coordinates
    def find_closest_node(lat, lng):
        return Node.objects.raw("""
            SELECT id, latitude, longitude, 
            (power(latitude - %s, 2) + power(longitude - %s, 2)) AS distance 
            FROM maps_node 
            ORDER BY distance ASC LIMIT 1
        """, [lat, lng])[0]

    source_node = find_closest_node(source_lat, source_lng)
    dest_node = find_closest_node(dest_lat, dest_lng)

    g = dijkstra.Graph()

    for edge in Edge.objects.all():
        g.addEdge(edge.start_node.latitude, edge.start_node.longitude, 
                  edge.end_node.latitude, edge.end_node.longitude, 
                  float(edge.weight))  # ✅ Use coordinates instead of names

    result = g.dijkstra(source_node.latitude, source_node.longitude, 
                        dest_node.latitude, dest_node.longitude)

    if "path" not in result:
        return Response({"error": "No path found"}, status=404)

    path_data = []
    for lat, lng in result["path"]:
        path_data.append({"lat": lat, "lng": lng})

    return Response({
        "path": path_data, 
        "distance": result["distance"]
    })