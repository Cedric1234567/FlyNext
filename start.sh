#!/bin/bash

echo "Building and starting FlyNext services..."

# Pull latest base images (optional, good practice)
# docker-compose pull

# Build images if necessary and start services in detached mode
docker-compose up -d --build

echo "Services started."
echo "Run './import-data.sh' next if you need to migrate and seed the database."