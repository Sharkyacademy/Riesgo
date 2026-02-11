# Use an official Python runtime as a parent image
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies including Node.js for Tailwind
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    libpq-dev \
    gcc \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Install Node.js dependencies for Tailwind
WORKDIR /app/theme/static_src
RUN npm install
RUN npm run build

# Go back to app root
WORKDIR /app

# Expose port
EXPOSE 8000

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN sed -i 's/\r$//g' /app/entrypoint.sh && chmod +x /app/entrypoint.sh

# Run entrypoint
ENTRYPOINT ["bash", "/app/entrypoint.sh"]
