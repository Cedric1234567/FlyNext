#!/bin/bash

echo "Stopping and removing FlyNext services..."

# Stop and remove containers, networks, and volumes defined in docker-compose
docker-compose down

echo "Services stopped."
