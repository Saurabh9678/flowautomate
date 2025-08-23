const app = require('./src/app');
const Database = require('./src/utils/database');
const rabbitMQManager = require('./src/utils/rabbitmqManager');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await Database.connect();
    
    // Validate that database schema matches models
    await Database.validateSchema();
    
    console.log('✅ Database connected and schema validated');

    // Initialize RabbitMQ
    await rabbitMQManager.initialize();
    console.log('✅ RabbitMQ initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/v1`);
      console.log(`🔗 API v1: http://localhost:${PORT}/v1`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await rabbitMQManager.close();
  await Database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await rabbitMQManager.close();
  await Database.close();
  process.exit(0);
});

startServer();
