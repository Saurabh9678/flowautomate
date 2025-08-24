# FlowAutomate Infrastructure Setup

This directory contains scripts to set up the complete FlowAutomate development environment.

## setup-infra.sh

A comprehensive setup script that automates the entire development environment setup for FlowAutomate.

### What it does:

1. **Docker Installation & Setup**
   - Checks if Docker is installed (macOS/Linux)
   - Installs Docker if not present
   - Ensures Docker daemon is running
   - Installs Docker Compose if needed

2. **Infrastructure Services**
   - PostgreSQL 15 (Database)
   - Elasticsearch 8.11.0 (Search engine)
   - Kibana 8.11.0 (Elasticsearch UI)
   - RabbitMQ 3 (Message queue)

3. **Project Setup**
   - Clones the FlowAutomate repository from GitHub
   - Sets up environment configuration (.env file)
   - Installs Node.js dependencies
   - Creates database and schema (self-contained, no external SQL files)
   - Starts the application

### Usage:

```bash
# Make the script executable (if not already)
chmod +x scripts/setup-infra.sh

# Run the setup script
./scripts/setup-infra.sh
```

### Prerequisites:

- Git (for cloning the repository)
- Internet connection (for downloading Docker images and npm packages)
- PostgreSQL client tools (will be installed automatically if missing)

### Services Configuration:

After running the script, the following services will be available:

- **PostgreSQL**: `localhost:5432` (admin/admin123)
- **Elasticsearch**: `http://localhost:9200`
- **Kibana**: `http://localhost:5601`
- **RabbitMQ**: `amqp://admin:admin123@localhost:5672`
- **RabbitMQ UI**: `http://localhost:15672` (admin/admin123)
- **FlowAutomate API**: `http://localhost:3000`

### Database Schema:

The script automatically creates the following database schema:
- `users` table (user accounts)
- `pdfs` table (PDF documents with processing status)
- Proper indexes and constraints
- Soft delete functionality

### Environment Variables:

The script configures the following environment variables in `.env`:
- Database connection (PostgreSQL)
- JWT secret (auto-generated)
- RabbitMQ connection
- Elasticsearch connection
- Server configuration

### Troubleshooting:

1. **Docker not running**: Start Docker Desktop (macOS) or `sudo systemctl start docker` (Linux)
2. **Port conflicts**: Ensure ports 3000, 5432, 5672, 9200, 5601, 15672 are available
3. **Permission issues**: Run with appropriate permissions for Docker commands
4. **Node.js not found**: The script will attempt to install Node.js automatically

### Stopping Services:

```bash
# Stop the application
kill <APP_PID>  # PID shown at the end of setup

# Stop all Docker services
docker-compose down
```
