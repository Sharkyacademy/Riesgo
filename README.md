# Riesgo - RBI Management System

This is a Django-based Risk-Based Inspection (RBI) management application, designed to manage asset integrity, risk analysis (API 581), and inspection planning.

## 🚀 Getting Started

### Prerequisites
- **Docker & Docker Compose** (Recommended)
- **Python 3.12+** & **PostgreSQL** (If running locally without Docker)

### 🛠️ Local Development (with Docker)

The easiest way to run the project locally.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Sharkyacademy/Riesgo.git
    cd Riesgo
    ```

2.  **Start the application:**
    ```bash
    docker compose up --build
    ```

3.  **Access the app:**
    Open [http://localhost:8000](http://localhost:8000)

4.  **Create a superuser:**
    ```bash
    docker compose exec web python manage.py createsuperuser
    ```

### 🐍 Local Development (Manual)

If you prefer running without Docker:

1.  **Create a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment:**
    Ensure you have a PostgreSQL database running and update `.env` or `settings.py` accordingly.

4.  **Run Migrations & Server:**
    ```bash
    python manage.py migrate
    python manage.py runserver
    ```

    *Note: You will need Node.js installed locally to build Tailwind CSS.*

---

## 🌍 Production Deployment (VPS)

This project is configured for easy deployment on a VPS (e.g., Hostinger, DigitalOcean) using Docker and Caddy for automatic HTTPS.

### Deployment Files
- `compose.prod.yml`: Production configuration (Gunicorn, no debug).
- `Caddyfile`: Reverse proxy configuration for HTTPS.
- `entrypoint.sh`: Startup script.

### Deploy Steps

1.  **On your VPS:**
    Clone the repo and set your domain:
    ```bash
    export DOMAIN_NAME=yourdomain.com
    ```

2.  **Run in Production Mode:**
    ```bash
    docker compose -f compose.prod.yml up -d --build
    ```

3.  **Update Application:**
    To deploy new changes from GitHub:
    ```bash
    git pull origin main
    docker compose -f compose.prod.yml up -d --build
    ```

## 📦 Tech Stack

- **Backend:** Django 5.x / Python 3.12
- **Frontend:** Django Templates + Tailwind CSS (via `django-tailwind`)
- **Database:** PostgreSQL 15
- **Infrastructure:** Docker, Docker Compose, Gunicorn, Caddy (Reverse Proxy/SSL)

## 📄 License

[MIT](LICENSE)
