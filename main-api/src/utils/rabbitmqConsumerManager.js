const RabbitMQConsumerService = require('../services/RabbitMQConsumerService');

class RabbitMQConsumerManager {
  constructor() {
    this.consumerService = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the consumer
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('RabbitMQ Consumer already initialized');
      return this.consumerService;
    }

    try {
      this.consumerService = new RabbitMQConsumerService();
      await this.consumerService.initialize();
      this.isInitialized = true;
      console.log('RabbitMQ Consumer Manager initialized successfully');
      return this.consumerService;
    } catch (error) {
      console.error('Failed to initialize RabbitMQ Consumer Manager:', error.message);
      throw error;
    }
  }

  /**
   * Get the consumer service instance
   */
  getConsumer() {
    if (!this.consumerService) {
      throw new Error('RabbitMQ Consumer not initialized');
    }
    return this.consumerService;
  }

  /**
   * Get consumer status
   */
  getStatus() {
    if (!this.consumerService) {
      return {
        isInitialized: false,
        consumer: null
      };
    }

    return {
      isInitialized: this.isInitialized,
      consumer: this.consumerService.getStatus()
    };
  }

  /**
   * Close the consumer
   */
  async close() {
    if (this.consumerService) {
      await this.consumerService.close();
      this.consumerService = null;
      this.isInitialized = false;
      console.log('RabbitMQ Consumer Manager closed successfully');
    }
  }
}

// Create singleton instance
const rabbitMQConsumerManager = new RabbitMQConsumerManager();

module.exports = rabbitMQConsumerManager;
