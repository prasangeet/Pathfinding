import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, LineString
import psycopg2

# Load road data from GeoJSON
roads = gpd.read_file(r"D:\Projects\pathfinding\backend\utils\jodhpurosm\lines.geojson")

# Filter only road-related features
road_types = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential']
roads = roads[roads['highway'].isin(road_types)]

# Extract nodes (intersections)
nodes = set()
edges = []

for _, road in roads.iterrows():
    coords = list(road.geometry.coords)
    for coord in coords:
        nodes.add(coord)

    for i in range(len(coords) - 1):
        start, end = coords[i], coords[i + 1]
        length = LineString([start, end]).length
        edges.append((start, end, length))

# Convert nodes to a DataFrame
nodes_df = pd.DataFrame(list(nodes), columns=['longitude', 'latitude'])
nodes_df['id'] = nodes_df.index  # Assign unique IDs

# Convert edges to a DataFrame
edges_df = pd.DataFrame(edges, columns=['start', 'end', 'weight'])

# Map edges to node IDs
node_dict = {tuple(row[:2]): row[2] for row in nodes_df.itertuples(index=False)}
edges_df['start_id'] = edges_df['start'].map(node_dict)
edges_df['end_id'] = edges_df['end'].map(node_dict)
edges_df.drop(['start', 'end'], axis=1, inplace=True)

# Connect to PostgreSQL
conn = psycopg2.connect("dbname=pathfindingdb user=postgres password=ppd12345 host=localhost")
cur = conn.cursor()

# Insert nodes
for _, row in nodes_df.iterrows():
    cur.execute("INSERT INTO maps_node (id, latitude, longitude) VALUES (%s, %s, %s)", (row['id'], row['latitude'], row['longitude']))

# Insert edges
for _, row in edges_df.iterrows():
    cur.execute("INSERT INTO maps_edge (start_node_id, end_node_id, weight) VALUES (%s, %s, %s)",
                (row['start_id'], row['end_id'], row['weight']))

conn.commit()
cur.close()
conn.close()

print("Data loaded successfully! "
"Nodes: {} | Edges: {}".format(len(nodes_df), len(edges_df)))

