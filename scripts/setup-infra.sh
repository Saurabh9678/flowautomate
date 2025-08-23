#!/usr/bin/env bash
set -euo pipefail

### Helpers
command_exists() { command -v "$1" >/dev/null 2>&1; }
log() { echo -e "[$(date '+%H:%M:%S')] $*"; }

### 1) Ensure prerequisites (Docker + Compose)

# macOS: ensure Homebrew exists for install path
if [[ "$OSTYPE" == "darwin"* ]]; then
  if ! command_exists brew; then
    log "Homebrew not found. Installing Homebrew (macOS)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    log "Homebrew installed."
  fi
fi

# Install Docker
if ! command_exists docker; then
  log "Docker not found. Installing Docker..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install --cask docker
    log "Docker Desktop installed. Please open the Docker app once to finish setup (GUI prompts)."
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm -f get-docker.sh
    # Try to start Docker service if available
    if command_exists systemctl; then
      sudo systemctl enable docker || true
      sudo systemctl start docker || true
    fi
  else
    log "Unsupported OS. Please install Docker manually: https://www.docker.com/products/docker-desktop/"
    exit 1
  fi
else
  log "Docker already installed ✅"
fi

# Ensure Docker daemon is running
if ! docker info >/dev/null 2>&1; then
  log "Docker is installed but not running."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    log "Open Docker Desktop from Applications, wait until it says 'Docker is running', then re-run this script."
  else
    log "Start the service: sudo systemctl start docker (then re-run this script)."
  fi
  exit 1
fi

# Install Docker Compose if neither v2 nor v1 is present
COMPOSE_CMD=""
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command_exists docker-compose; then
  COMPOSE_CMD="docker-compose"
else
  log "Docker Compose not found. Installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Docker Desktop usually includes v2, but install v1 fallback for compatibility
    brew install docker-compose
    COMPOSE_CMD="docker-compose"
  else
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
      -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    COMPOSE_CMD="docker-compose"
  fi
fi
log "Using Compose command: $COMPOSE_CMD"

### 2) Generate docker-compose.yml
cat > docker-compose.yml <<'YML'
services:
  postgres:
    image: postgres:15
    container_name: local_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: admin123
      POSTGRES_DB: pdf_system
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d pdf_system"]
      interval: 10s
      timeout: 5s
      retries: 10

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: local_elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - es_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:9200 >/dev/null || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 20

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: local_kibana
    restart: unless-stopped
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -fsS http://localhost:5601/api/status >/dev/null || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 30

  rabbitmq:
    image: rabbitmq:3-management
    container_name: local_rabbitmq
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin123
    ports:
      - "5672:5672"    # AMQP
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD-SHELL", "rabbitmq-diagnostics -q ping"]
      interval: 10s
      timeout: 5s
      retries: 20

volumes:
  postgres_data:
  es_data:
  rabbitmq_data:
YML

### 3) Check if services are already running
log "Checking if services are already running..."
if $COMPOSE_CMD ps --services --filter "status=running" | grep -q "postgres\|elasticsearch\|kibana\|rabbitmq"; then
  log "Some services are already running. Checking if all required services are healthy..."
  
  # Check if all containers are running and healthy
  if docker ps --filter "name=local_postgres" --filter "status=running" --format "{{.Names}}" | grep -q local_postgres && \
     docker ps --filter "name=local_elasticsearch" --filter "status=running" --format "{{.Names}}" | grep -q local_elasticsearch && \
     docker ps --filter "name=local_kibana" --filter "status=running" --format "{{.Names}}" | grep -q local_kibana && \
     docker ps --filter "name=local_rabbitmq" --filter "status=running" --format "{{.Names}}" | grep -q local_rabbitmq; then
    
    log "✅ All services are already running. Skipping startup."
    log "Checking service health..."
    
    # Quick health check for already running services
    if curl -fsS http://localhost:9200 >/dev/null 2>&1 && \
       curl -fsS http://localhost:5601/api/status >/dev/null 2>&1 && \
       docker exec local_rabbitmq rabbitmq-diagnostics -q ping >/dev/null 2>&1; then
      log "✅ All services are healthy and ready."
      echo
      echo "PostgreSQL:  host=localhost  port=5432  user=admin  pass=admin  db=pdf_system"
      echo "Elasticsearch: http://localhost:9200"
      echo "Kibana UI:     http://localhost:5601"
      echo "RabbitMQ AMQP: amqp://admin:admin@localhost:5672"
      echo "RabbitMQ UI:   http://localhost:15672  (user: admin, pass: admin)"
      echo
      exit 0
    else
      log "⚠️  Services are running but not all healthy. Restarting services..."
      $COMPOSE_CMD down
      sleep 2
    fi
  else
    log "⚠️  Some services are running but not all. Restarting all services..."
    $COMPOSE_CMD down
    sleep 2
  fi
else
  log "No services are currently running."
fi

### 4) Start services
log "Starting services (Postgres, Elasticsearch, Kibana, RabbitMQ)..."
$COMPOSE_CMD up -d

### 5) Wait for readiness
retry() {
  local max=$1; shift
  local i=1
  until "$@"; do
    [[ $i -ge $max ]] && return 1
    sleep 3
    i=$((i + 1))
  done
}

log "Waiting for Postgres to be healthy..."
retry 30 bash -c 'docker ps --filter "name=local_postgres" --filter "health=healthy" --format "{{.Names}}" | grep -q local_postgres' \
  || { log "Postgres failed to become healthy."; exit 1; }

log "Waiting for Elasticsearch to be healthy..."
retry 30 bash -c 'curl -fsS http://localhost:9200 >/dev/null' \
  || { log "Elasticsearch not responding on :9200"; exit 1; }

log "Waiting for Kibana to be healthy..."
retry 60 bash -c 'curl -fsS http://localhost:5601/api/status >/dev/null' \
  || { log "Kibana not responding on :5601"; exit 1; }

log "Waiting for RabbitMQ to be healthy..."
retry 30 bash -c 'docker exec local_rabbitmq rabbitmq-diagnostics -q ping >/dev/null' \
  || { log "RabbitMQ health check failed."; exit 1; }

### 6) Done
echo
log "✅ All services are up and healthy."
echo
echo "PostgreSQL:  host=localhost  port=5432  user=admin  pass=admin123  db=pdf_system"
echo "Elasticsearch: http://localhost:9200"
echo "Kibana UI:     http://localhost:5601"
echo "RabbitMQ AMQP: amqp://admin:admin123@localhost:5672"
echo "RabbitMQ UI:   http://localhost:15672  (user: admin, pass: admin123)"
echo
