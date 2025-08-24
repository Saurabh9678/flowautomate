const app = require('./src/app');
const Database = require('./src/utils/database');
const rabbitMQManager = require('./src/utils/rabbitmqManager');
const rabbitMQConsumerManager = require('./src/utils/rabbitmqConsumerManager');
const elasticsearchManager = require('./src/utils/elasticsearchManager');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('Starting server initialization...');

    // Step 1: Connect to database
    console.log('Connecting to database...');
    await Database.connect();
    await Database.validateSchema();
    console.log('Database connected and schema validated');

    // Step 2: Initialize RabbitMQ Producer
    console.log('Initializing RabbitMQ Producer...');
    await rabbitMQManager.initialize();
    console.log('RabbitMQ Producer initialized');
    
    // Step 3: Initialize Elasticsearch
    console.log('Initializing Elasticsearch...');
    await elasticsearchManager.initialize();
    console.log('Elasticsearch initialized');

    // Step 4: Initialize RabbitMQ Consumer (after Elasticsearch is ready)
    console.log('Initializing RabbitMQ Consumer...');
    await rabbitMQConsumerManager.initialize();
    console.log('RabbitMQ Consumer initialized');

    // Step 5: Start the server
    console.log('Starting HTTP server...');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API available at http://localhost:${PORT}/v1`);
      console.log('All services initialized successfully!');
    });

  } catch (error) {
    console.error('Server initialization failed:', error.message);
    console.error('Error details:', error);
    console.error('Stopping server due to initialization failure');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  
  try {
    // Close RabbitMQ Consumer
    if (rabbitMQConsumerManager) {
      await rabbitMQConsumerManager.close();
      console.log('RabbitMQ Consumer closed');
    }

    // Close RabbitMQ Producer
    if (rabbitMQManager) {
      await rabbitMQManager.close();
      console.log('RabbitMQ Producer closed');
    }

    // Close Elasticsearch
    if (elasticsearchManager) {
      await elasticsearchManager.close();
      console.log('Elasticsearch closed');
    }

    // Close database connection
    if (Database) {
      await Database.close();
      console.log('Database connection closed');
    }

    console.log('All services closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
