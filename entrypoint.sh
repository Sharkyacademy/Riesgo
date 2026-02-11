#!/bin/bash

# Wait for database if necessary (handled by depends_on usually, but good to have netcat check if strict)

# Apply database migrations
echo "Applying database migrations..."
python manage.py migrate

# Collect static files (optional for dev, needed for prod)
echo "Collecting static files..."
python manage.py collectstatic --noinput

exec "$@"
