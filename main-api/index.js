const app = require('./src/app');
const Database = require('./src/utils/database');
const rabbitMQManager = require('./src/utils/rabbitmqManager');
const rabbitMQConsumerManager = require('./src/utils/rabbitmqConsumerManager');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await Database.connect();
    await Database.validateSchema();
    console.log('✅ Database connected and schema validated');

    // Initialize RabbitMQ Producer (optional - won't fail server startup)
    try {
      await rabbitMQManager.initialize();
      console.log('✅ RabbitMQ Producer initialized');
    } catch (rabbitError) {
      console.warn('⚠️ RabbitMQ Producer initialization failed:', rabbitError.message);
      console.log('📋 PDF upload will work, but RabbitMQ messaging will be disabled');
    }

    // Initialize RabbitMQ Consumer (optional - won't fail server startup)
    try {
      await rabbitMQConsumerManager.initialize();
      console.log('✅ RabbitMQ Consumer initialized');
    } catch (rabbitError) {
      console.warn('⚠️ RabbitMQ Consumer initialization failed:', rabbitError.message);
      console.log('📋 PDF parsing will work, but message consumption will be disabled');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/v1`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/`);
      
      // Show RabbitMQ status
      const producerStatus = rabbitMQManager.getStatus();
      const consumerStatus = rabbitMQConsumerManager.getStatus();
      
      if (producerStatus.isInitialized) {
        console.log('📤 RabbitMQ Producer: ✅ Active');
      } else {
        console.log('📤 RabbitMQ Producer: ❌ Disabled');
      }
      
      if (consumerStatus.isInitialized) {
        console.log('📥 RabbitMQ Consumer: ✅ Active');
      } else {
        console.log('📥 RabbitMQ Consumer: ❌ Disabled');
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  try {
    await rabbitMQConsumerManager.close();
  } catch (error) {
    console.warn('⚠️ Error closing RabbitMQ Consumer:', error.message);
  }
  try {
    await rabbitMQManager.close();
  } catch (error) {
    console.warn('⚠️ Error closing RabbitMQ Producer:', error.message);
  }
  try {
    await Database.close();
  } catch (error) {
    console.warn('⚠️ Error closing database:', error.message);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  try {
    await rabbitMQConsumerManager.close();
  } catch (error) {
    console.warn('⚠️ Error closing RabbitMQ Consumer:', error.message);
  }
  try {
    await rabbitMQManager.close();
  } catch (error) {
    console.warn('⚠️ Error closing RabbitMQ Producer:', error.message);
  }
  try {
    await Database.close();
  } catch (error) {
    console.warn('⚠️ Error closing database:', error.message);
  }
  process.exit(0);
});

// Start the server
startServer();
