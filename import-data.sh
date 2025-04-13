#!/bin/bash

echo "Ensuring database migrations are applied..."

# Execute prisma migrate deploy inside the running 'app' container
# 'deploy' is non-interactive, suitable for scripts. Use 'dev' for initial setup if needed.
docker-compose exec app npx prisma migrate deploy

# Check migration status (optional)
# docker-compose exec app npx prisma migrate status

echo "Migrations applied."
echo ""
echo "Seeding database with initial data..."

# Execute the database seed script inside the 'app' container
# Ensure you have a "db:seed" script in your package.json, e.g., "node prisma/seed.js"
docker-compose exec app npm run db:seed

echo "Database seeding complete."
