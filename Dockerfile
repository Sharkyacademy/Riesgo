# Stage 1: Build Tailwind CSS
FROM node:18-alpine AS node-builder

WORKDIR /app

# Copy package.json and install dependencies
COPY theme/static_src/package.json theme/static_src/package-lock.json* ./theme/static_src/
WORKDIR /app/theme/static_src
RUN npm install

# Copy the rest of the theme files
COPY theme/ ./theme/

# Build Tailwind
# Adjust the build command based on your package.json scripts
# Assuming 'npm run build' generates the css file in the correct static location
COPY . /app
WORKDIR /app/theme/static_src
RUN npm run build

# Stage 2: Python Application
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install gunicorn psycopg2-binary whitenoise dj-database-url

# Copy project files
COPY . .

# Copy built static files from node-builder stage
# Adjust paths if your build output goes somewhere else
COPY --from=node-builder /app/static /app/static

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
