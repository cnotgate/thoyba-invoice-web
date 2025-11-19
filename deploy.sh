#!/bin/bash

echo "==========================================="
echo " Invoice Modern Stack - Setup and Deploy"
echo "==========================================="
echo

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file and set your JWT_SECRET"
    echo "You can generate one with: openssl rand -base64 32"
    read -p "Press enter to continue..."
fi

echo
echo "Building and starting Docker containers..."
docker-compose -f docker-compose.yml up --build -d

echo
echo "Waiting for database to be ready..."
sleep 10

echo
echo "Running database migrations..."
docker-compose -f docker-compose.yml exec backend bun run db:migrate

echo
echo "Seeding database with initial data..."
docker-compose -f docker-compose.yml exec backend bun run db:seed

echo
echo "==========================================="
echo " Setup Complete!"
echo "==========================================="
echo
echo "Application is running at: http://localhost:8600"
echo
echo "Default login credentials:"
echo "  Admin: admin / admin123"
echo "  User:  user / user123"
echo
echo "To view logs: docker-compose -f docker-compose.yml logs -f"
echo "To stop: docker-compose -f docker-compose.yml down"
echo
