from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response

# **Find the closest node using PostGIS**
def find_closest_node(lat, lng):
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT id FROM maps_node
            ORDER BY ST_DistanceSphere(
                ST_MakePoint(longitude, latitude),
                ST_MakePoint(%s, %s)
            )
            LIMIT 1;
        """, [lng, lat])  # Longitude first, then latitude
        row = cursor.fetchone()
        return row[0] if row else None

# **Run Dijkstra's Algorithm in PostgreSQL**
def find_shortest_path(source_lat, source_lng, dest_lat, dest_lng):
    source_node = find_closest_node(source_lat, source_lng)
    dest_node = find_closest_node(dest_lat, dest_lng)

    if source_node is None or dest_node is None:
        return {"error": "No valid nodes found"}

    path_data = []
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT node FROM pgr_dijkstra(
                'SELECT id, start_node_id AS source, end_node_id AS target, weight AS cost FROM maps_edge',
                %s, %s, directed := false
            );
        """, [source_node, dest_node])
        result = cursor.fetchall()

        for row in result:
            node_id = row[0]
            cursor.execute("SELECT latitude, longitude FROM maps_node WHERE id = %s", [node_id])
            node_data = cursor.fetchone()
            if node_data:
                lat, lng = node_data
                path_data.append({"lat": lat, "lng": lng})
    
    return {"path": path_data}

# **Django API Endpoint**
@api_view(['GET'])
def shortest_path(request):
    try:
        source_lat = float(request.GET.get('source_lat'))
        source_lng = float(request.GET.get('source_lng'))
        dest_lat = float(request.GET.get('dest_lat'))
        dest_lng = float(request.GET.get('dest_lng'))
    except (TypeError, ValueError):
        return Response({"error": "Invalid coordinates"}, status=400)

    result = find_shortest_path(source_lat, source_lng, dest_lat, dest_lng)

    if "error" in result:
        return Response(result, status=404)

    return Response(result)
