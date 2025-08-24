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
      POSTGRES_DB: flowautomate_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d flowautomate_db"]
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
      echo "PostgreSQL:  host=localhost  port=5432  user=admin  pass=admin123  db=flowautomate_db"
      echo "Elasticsearch: http://localhost:9200"
      echo "Kibana UI:     http://localhost:5601"
      echo "RabbitMQ AMQP: amqp://admin:admin123@localhost:5672"
      echo "RabbitMQ UI:   http://localhost:15672  (user: admin, pass: admin123)"
      echo
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

### 6) Clone the project
log "Cloning FlowAutomate project..."
if [ -d "flowautomate" ]; then
  log "Project directory already exists. Pulling latest changes..."
  cd flowautomate
  git pull origin main
  cd ..
else
  git clone https://github.com/Saurabh9678/flowautomate.git
fi

### 7) Setup environment configuration
log "Setting up environment configuration..."
cd flowautomate/main-api

# Create .env file from example
if [ ! -f ".env" ]; then
  log "Creating .env file from template..."
  cp env.example .env
  
  # Update .env with correct values for our Docker setup
  sed -i.bak 's/DB_HOST=localhost/DB_HOST=localhost/' .env
  sed -i.bak 's/DB_PORT=5432/DB_PORT=5432/' .env
  sed -i.bak 's/DB_NAME=flowautomate_db/DB_NAME=flowautomate_db/' .env
  sed -i.bak 's/DB_USER=postgres/DB_USER=admin/' .env
  sed -i.bak 's/DB_PASSWORD=your_password/DB_PASSWORD=admin123/' .env
  sed -i.bak 's/RABBITMQ_URL=amqp:\/\/guest:guest@localhost:5672/RABBITMQ_URL=amqp:\/\/admin:admin123@localhost:5672/' .env
  sed -i.bak 's/RABBITMQ_USERNAME=guest/RABBITMQ_USERNAME=admin/' .env
  sed -i.bak 's/RABBITMQ_PASSWORD=guest/RABBITMQ_PASSWORD=admin123/' .env
  sed -i.bak 's/ELASTICSEARCH_USERNAME=admin/ELASTICSEARCH_USERNAME=admin/' .env
  sed -i.bak 's/ELASTICSEARCH_PASSWORD=admin123/ELASTICSEARCH_PASSWORD=admin123/' .env
  
  # Generate a random JWT secret
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i.bak "s/JWT_SECRET=your_jwt_secret_key_here/JWT_SECRET=$JWT_SECRET/" .env
  
  rm -f .env.bak
  log "✅ Environment file configured"
else
  log "✅ Environment file already exists"
fi

### 8) Install Node.js dependencies
log "Installing Node.js dependencies..."
if ! command_exists node; then
  log "Node.js not found. Installing Node.js..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install node
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
  else
    log "Please install Node.js manually: https://nodejs.org/"
    exit 1
  fi
fi

npm install
log "✅ Dependencies installed"

### 9) Setup database schema
log "Setting up database schema..."

# Check if PostgreSQL client is available
if ! command_exists psql; then
  log "PostgreSQL client (psql) not found. Installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install postgresql
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt-get update && sudo apt-get install -y postgresql-client
  else
    log "Please install PostgreSQL client manually: https://www.postgresql.org/download/"
    exit 1
  fi
fi

# Wait a bit more for PostgreSQL to be fully ready
sleep 5

# Create the database if it doesn't exist
log "Creating database if it doesn't exist..."
PGPASSWORD=admin123 psql -h localhost -U admin -d postgres -c "CREATE DATABASE flowautomate_db;" 2>/dev/null || log "Database already exists or creation failed (this is OK)"

# Wait a moment for database creation to complete
sleep 2

# Create the database schema directly in the script
log "Creating database schema..."
PGPASSWORD=admin123 psql -h localhost -U admin -d flowautomate_db << 'EOF' || {
  log "❌ Failed to create database schema. Please check PostgreSQL connection and permissions."
  exit 1
}
-- Create enum for PDF status
CREATE TYPE enum_pdfs_status AS ENUM ('queued', 'parsing', 'transform', 'ready', 'failed');

-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create pdfs table
CREATE TABLE pdfs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    pdf_path TEXT NOT NULL,
    status enum_pdfs_status DEFAULT 'queued',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_pdfs_user_id ON pdfs(user_id);
CREATE INDEX idx_pdfs_status ON pdfs(status);
CREATE INDEX idx_pdfs_deleted_at ON pdfs(deleted_at);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts for the FlowAutomate application';
COMMENT ON TABLE pdfs IS 'PDF documents associated with users';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN pdfs.deleted_at IS 'Soft delete timestamp - null means not deleted';
COMMENT ON COLUMN pdfs.status IS 'Current processing status of the PDF';
EOF

log "✅ Database schema created"

# Verify database setup
log "Verifying database setup..."
PGPASSWORD=admin123 psql -h localhost -U admin -d flowautomate_db << 'EOF' || {
  log "❌ Failed to verify database setup. Please check if schema was created correctly."
  exit 1
}
-- Check if tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'pdfs')
ORDER BY table_name;

-- Check if enum type exists
SELECT 
    typname as enum_name,
    CASE 
        WHEN typname IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM pg_type 
WHERE typname = 'enum_pdfs_status';

-- Check if indexes exist
SELECT 
    indexname,
    CASE 
        WHEN indexname IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM pg_indexes 
WHERE tablename IN ('users', 'pdfs')
    AND indexname IN (
        'idx_users_username',
        'idx_users_deleted_at', 
        'idx_pdfs_user_id',
        'idx_pdfs_status',
        'idx_pdfs_deleted_at'
    )
ORDER BY indexname;
EOF

log "✅ Database verification complete"

### 10) Start the application
log "Starting the FlowAutomate application..."
npm run dev &
APP_PID=$!

# Wait a moment for the app to start
sleep 5

# Check if the app is running
if curl -fsS http://localhost:3000 >/dev/null 2>&1; then
  log "✅ FlowAutomate application is running on http://localhost:3000"
else
  log "⚠️  Application may still be starting up. Check http://localhost:3000 in a moment."
fi

### 11) Final status
echo
log "🎉 Setup complete! FlowAutomate is ready to use."
echo
echo "📊 Service Status:"
echo "PostgreSQL:  host=localhost  port=5432  user=admin  pass=admin123  db=flowautomate_db"
echo "Elasticsearch: http://localhost:9200"
echo "Kibana UI:     http://localhost:5601"
echo "RabbitMQ AMQP: amqp://admin:admin123@localhost:5672"
echo "RabbitMQ UI:   http://localhost:15672  (user: admin, pass: admin123)"
echo "FlowAutomate:  http://localhost:3000"
echo
echo "📁 Project location: $(pwd)"
echo "🔧 To stop the application: kill $APP_PID"
echo "🛑 To stop all services: docker-compose down"
echo
