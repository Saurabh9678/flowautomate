const app = require('./src/app');
const Database = require('./src/utils/database');
const rabbitMQManager = require('./src/utils/rabbitmqManager');
const rabbitMQConsumerManager = require('./src/utils/rabbitmqConsumerManager');
const elasticsearchManager = require('./src/utils/elasticsearchManager');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await Database.connect();
    await Database.validateSchema();
    console.log('Database connected and schema validated');

    // Initialize RabbitMQ Producer
    try {
      await rabbitMQManager.initialize();
      console.log('RabbitMQ Producer initialized');
    } catch (rabbitError) {
      console.warn('RabbitMQ Producer initialization failed:', rabbitError.message);
    }

    // Initialize RabbitMQ Consumer
    try {
      await rabbitMQConsumerManager.initialize();
      console.log('RabbitMQ Consumer initialized');
    } catch (rabbitError) {
      console.warn('RabbitMQ Consumer initialization failed:', rabbitError.message);
    }

    // Initialize Elasticsearch
    try {
      await elasticsearchManager.initialize();
      console.log('Elasticsearch initialized');
    } catch (esError) {
      console.warn('Elasticsearch initialization failed:', esError.message);
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API Documentation: http://localhost:${PORT}/v1`);
      console.log(`Health Check: http://localhost:${PORT}/v1`);
      
      // Show service status
      const producerStatus = rabbitMQManager.getStatus();
      const consumerStatus = rabbitMQConsumerManager.getStatus();
      const esStatus = elasticsearchManager.getStatus();
      
      if (producerStatus.isInitialized) {
        console.log('RabbitMQ Producer: Active');
      } else {
        console.log('RabbitMQ Producer: Disabled');
      }
      
      if (consumerStatus.isInitialized) {
        console.log('RabbitMQ Consumer: Active');
      } else {
        console.log('RabbitMQ Consumer: Disabled');
      }
      
      if (esStatus.isInitialized) {
        console.log('Elasticsearch: Active');
      } else {
        console.log('Elasticsearch: Disabled');
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await elasticsearchManager.close();
  } catch (error) {
    console.warn('Error closing Elasticsearch:', error.message);
  }
  try {
    await rabbitMQConsumerManager.close();
  } catch (error) {
    console.warn('Error closing RabbitMQ Consumer:', error.message);
  }
  try {
    await rabbitMQManager.close();
  } catch (error) {
    console.warn('Error closing RabbitMQ Producer:', error.message);
  }
  try {
    await Database.close();
  } catch (error) {
    console.warn('Error closing database:', error.message);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await elasticsearchManager.close();
  } catch (error) {
    console.warn('Error closing Elasticsearch:', error.message);
  }
  try {
    await rabbitMQConsumerManager.close();
  } catch (error) {
    console.warn('Error closing RabbitMQ Consumer:', error.message);
  }
  try {
    await rabbitMQManager.close();
  } catch (error) {
    console.warn('Error closing RabbitMQ Producer:', error.message);
  }
  try {
    await Database.close();
  } catch (error) {
    console.warn('Error closing database:', error.message);
  }
  process.exit(0);
});

// Start the server
startServer();
