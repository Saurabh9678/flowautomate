# Main API - Clean Architecture with Event-Driven PDF Processing

A comprehensive Node.js API built with **Express.js**, **PostgreSQL**, and **Elasticsearch** using Clean Architecture principles. This project follows **DRY (Don't Repeat Yourself)** principle and implements an **event-driven architecture** for scalable PDF processing and search capabilities.

## 🎯 Overview

This project provides a complete solution for user management, PDF upload, processing, and intelligent search functionality. It features **JWT token-based authentication**, **rate limiting** for security, and leverages **RabbitMQ** for event-driven processing. When a PDF is uploaded and parsed, an event is generated and queued. The consumer processes these events through an **ETL pipeline** for data cleaning and transformation, storing the processed data in **Elasticsearch** for efficient searching. The system ensures reliable message processing with acknowledgment mechanisms.

### 🛠️ **Tech Stack**
- **Backend Framework**: **Express.js** with **Node.js**
- **Database**: **PostgreSQL** with **Sequelize ORM**
- **Search Engine**: **Elasticsearch**
- **Message Queue**: **RabbitMQ**
- **Authentication**: **JWT (JSON Web Tokens)**
- **Security**: **Rate Limiting**, **Helmet**, **CORS**
- **File Processing**: **PDF parsing and ETL pipeline**
- **Architecture**: **Clean Architecture** with **Event-Driven Design**

## 🏗️ Architecture

The file structure of this project, along with a description of the contents of each file, is provided below.:

```
src/
├── config/          # Configuration files for external services
│   ├── database.js      # PostgreSQL database configuration
│   ├── elasticsearch.js # Elasticsearch connection setup
│   └── rabbitmq.js      # RabbitMQ connection configuration
├── controllers/     # HTTP request/response handlers
│   ├── UserController.js    # User authentication and management
│   ├── PdfController.js     # PDF upload and management
│   └── SearchController.js  # Search functionality
├── services/        # Business logic layer
│   ├── UserService.js           # User business logic
│   ├── PdfService.js            # PDF processing logic
│   ├── ElasticsearchService.js  # Search and indexing operations
│   ├── RabbitMQService.js       # Message queue producer
│   └── RabbitMQConsumerService.js # Message queue consumer
├── repositories/    # Data access layer
│   ├── BaseRepository.js    # Base repository with common CRUD operations
│   ├── UserRepository.js    # User data access operations
│   └── PdfRepository.js     # PDF data access operations
├── models/          # Sequelize models
│   ├── index.js     # Model associations and database connection
│   ├── User.js      # User model definition
│   └── Pdf.js       # PDF model definition
├── routes/          # API route definitions
│   ├── v1.js            # Main router with versioning
│   ├── userRoutes.js    # User-related endpoints
│   ├── pdfRoutes.js     # PDF-related endpoints
│   └── searchRoutes.js  # Search-related endpoints
├── middleware/      # Express middleware
│   ├── auth.js          # JWT authentication middleware
│   ├── rateLimiter.js   # Rate limiting for API protection
│   ├── upload.js        # File upload handling
│   ├── errorHandler.js  # Global error handling
│   ├── asyncHandler.js  # Async error wrapper
│   └── joiValidation.js # Request validation
├── utils/           # Utility functions and helpers
│   ├── apiResponse.js           # Standardized API responses
│   ├── CustomError.js           # Custom error classes
│   ├── jwt.js                   # JWT token utilities
│   ├── database.js              # Database utilities
│   ├── pdfParser.js             # PDF parsing and extraction
│   ├── etlUtils.js              # ETL pipeline utilities
│   ├── elasticsearchManager.js  # Elasticsearch connection management
│   ├── rabbitmqManager.js       # RabbitMQ connection management
│   └── rabbitmqConsumerManager.js # Consumer management
├── validations/     # Request validation schemas
│   └── userValidation.js    # User input validation rules
└── app.js          # Express application setup and configuration
```


## 🏗️ System Design Diagram

For a visual representation of the system architecture, data flow, and component interactions, check out our FigJam board:

**[🎨 View System Design Diagram](https://www.figma.com/board/og7yUwMzvAxm6Ut51Blky0/Untitled?node-id=0-1&t=r7gh7gtnL5PI0EKE-1)**

The diagram illustrates the complete system architecture including user flows, data processing pipelines, event-driven communication, and infrastructure components.

## 🗄️ Database Schema Diagram

For a detailed view of the database structure, table relationships, and data models, explore our interactive schema diagram:

**[📊 View Database Schema](https://dbdocs.io/gohainsaurabh/FlowAutomate?view=relationships)**

The schema diagram shows the complete database design including table structures, foreign key relationships, indexes, and data types for the PostgreSQL database.

## 📚 API Documentation

For detailed API documentation with examples and testing capabilities, visit our Postman collection:

**[📖 View API Documentation](https://documenter.getpostman.com/view/32094781/2sB3BLkTua)**

The documentation includes all available endpoints, request/response examples, authentication methods, and testing scenarios for the complete API.

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Docker (for local external services setup)
- Git

## 🚀 Setup Instructions

### 1. Clone the Project
```bash
git clone <repository-url>
cd flowautomate/main-api
```

### 2. Setup External Services (Optional - Local Development)

If you want to run external services locally using Docker, execute the setup script:

```bash
cd ../scripts
./setup-infra.sh
```

This will start Docker containers for:
- PostgreSQL database
- Elasticsearch
- RabbitMQ

### 3. Database Setup

#### Create Database
```sql
CREATE DATABASE flowautomate_db;
```

#### Access PostgreSQL Container
```bash
docker exec -it local_postgres psql -U admin -d flowautomate_db
```

#### Create Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMP
);
```

#### Create PDFs Table
```sql
CREATE TABLE pdfs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    pdf_path TEXT NOT NULL,
    status TEXT CHECK (status IN ('queued', 'parsing', 'transform', 'ready', 'failed')) DEFAULT 'queued',
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_pdfs_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);
```

### 4. Environment Configuration

Copy the environment example file:
```bash
cp env.example .env
```

**For Local Setup (Docker):**
- No changes required to the `.env` file - it's configured for local Docker services

**For Custom Setup:**
- Update the database credentials, Elasticsearch, and RabbitMQ connection details in the `.env` file

### 5. Install Dependencies
```bash
npm install
```

### 6. Start the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### 7. Verify Setup

- Check if the server is running: `http://localhost:3000/v1`


## 📄 License

This project is licensed under the ISC License.
