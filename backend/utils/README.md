docker run --rm -it -v ${PWD}:/data -p 8080:8080 maptiler/tileserver-gl --file /data/pune.mbtiles 

docker run -it --rm -v ${PWD}:/data ghcr.io/systemed/tilemaker:master /data/pune.osm.pbf --output /data/pune.mbtiles