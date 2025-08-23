# Main API - Clean Architecture with PostgreSQL

A Node.js API built with Express.js and PostgreSQL using Clean Architecture principles. The application automatically handles database schema migrations and provides a robust foundation for building scalable APIs.

## 🏗️ Architecture

This project follows Clean Architecture principles with the following structure:

```
src/
├── controllers/     # HTTP request/response handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── models/          # Sequelize models
├── routes/          # API route definitions
├── middleware/      # Express middleware
├── migrations/      # Database migrations
├── utils/           # Utility functions
└── app.js          # Express application setup
```

## 🚀 Features

- **Clean Architecture**: Separation of concerns with layers (Controllers, Services, Repositories)
- **Automatic Migrations**: Database schema changes are automatically detected and applied
- **PostgreSQL Integration**: Robust database with Sequelize ORM
- **Security**: Helmet, CORS, input validation
- **Error Handling**: Comprehensive error handling middleware
- **Logging**: Request logging with Morgan
- **Environment Configuration**: Environment-based configuration

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository and navigate to the main-api folder:**
   ```bash
   cd main-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=flowautomate_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE flowautomate_db;
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 📊 Database Schema Management

The application uses Sequelize's built-in sync functionality to manage database schema. The system automatically creates and updates tables based on your models.

### 🔄 Schema Sync Mode

- **Alter Sync**: Always enabled - safely modifies existing tables to match models and creates tables if they don't exist

### Environment Configuration

```env
# All environments - Alter sync is always enabled for safe schema changes
NODE_ENV=development
# No additional configuration needed
```

### Schema Changes

When you modify your models, the database schema will be updated automatically:

1. **Add new models**: Tables are created automatically
2. **Modify existing models**: Schema changes are applied based on sync mode
3. **Remove models**: Tables are handled according to sync mode

### Best Practices

1. **All Environments**: Alter sync is automatically enabled for safe schema changes
2. **Model Changes**: Any changes to your models will be automatically applied to the database
3. **Data Safety**: Existing data is always preserved during schema updates
4. **Backup**: Always backup your database before major schema changes

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### PDFs
- `POST /api/pdfs` - Create a new PDF entry
- `GET /api/pdfs` - Get all PDFs
- `GET /api/pdfs/queued` - Get queued PDFs
- `GET /api/pdfs/ready` - Get ready PDFs
- `GET /api/pdfs/failed` - Get failed PDFs
- `GET /api/pdfs/user/:userId` - Get PDFs by user ID
- `GET /api/pdfs/:id` - Get PDF by ID
- `PUT /api/pdfs/:id/status` - Update PDF status
- `DELETE /api/pdfs/:id` - Delete PDF

## 📝 Example API Usage

### Register a User
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

### Create a PDF Entry
```bash
curl -X POST http://localhost:3000/api/pdfs \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "pdfPath": "/path/to/document.pdf"
  }'
```

### Update PDF Status
```bash
curl -X PUT http://localhost:3000/api/pdfs/1/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ready"
  }'
```

## 🔧 Adding New Features

### 1. Create a Model
Create a new model in `src/models/` following the existing pattern.

### 2. Create a Repository
Extend `BaseRepository` in `src/repositories/` for data access.

### 3. Create a Service
Add business logic in `src/services/`.

### 4. Create a Controller
Handle HTTP requests in `src/controllers/`.

### 5. Add Routes
Define API endpoints in `src/routes/`.

### 6. Create Migration (if needed)
The system will automatically detect and run new migrations.

## 🛡️ Security Features

- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Sequelize model validation
- **Password Hashing**: bcryptjs for password security
- **Error Handling**: Comprehensive error responses

## 📦 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | flowautomate_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | - |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_EXPIRES_IN` | JWT expiration | 24h |
| `CORS_ORIGIN` | CORS origin | http://localhost:3000 |

## 🐛 Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists
4. Check network connectivity

### Migration Issues
1. Check migration files for syntax errors
2. Ensure migrations are in correct order
3. Verify database permissions

### Port Already in Use
Change the `PORT` in your `.env` file or kill the process using the port.

## 📄 License

This project is licensed under the ISC License.
