#!/bin/bash
#This was generated with the help of ChatGPT

set -e  # Exit on error

echo "Installing dependencies..."
npm install

echo "Running database migrations..."
npx prisma migrate dev --name DB migrations added  # Adjust this command based on your migration setup

echo "Fetching cities and airports from AFS..."
node -e 'require("./src/utils/saveCity_Airports").saveCities()'

node -e 'require("./src/utils/saveCity_Airports").saveAirports()'

echo "Setup complete!"
