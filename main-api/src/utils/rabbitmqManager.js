const RabbitMQService = require('../services/RabbitMQService');

class RabbitMQManager {
  constructor() {
    this.rabbitMQService = null;
    this.isInitialized = false;
  }

  /**
   * Initialize RabbitMQ service
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('RabbitMQ already initialized');
      return this.rabbitMQService;
    }

    try {
      this.rabbitMQService = new RabbitMQService();
      await this.rabbitMQService.initialize();
      this.isInitialized = true;
      console.log('✅ RabbitMQ manager initialized successfully');
      return this.rabbitMQService;
    } catch (error) {
      console.error('❌ Failed to initialize RabbitMQ manager:', error);
      throw error;
    }
  }

  /**
   * Get RabbitMQ service instance
   */
  getService() {
    if (!this.rabbitMQService) {
      throw new Error('RabbitMQ service not initialized. Call initialize() first.');
    }
    return this.rabbitMQService;
  }

  /**
   * Send PDF parsed message
   */
  async sendPdfParsedMessage(data) {
    const service = this.getService();
    return await service.sendPdfParsedMessage(data);
  }

  /**
   * Send custom message to specific queue
   */
  async sendMessage(queueName, message, options = {}) {
    const service = this.getService();
    return await service.sendMessage(queueName, message, options);
  }

  /**
   * Get connection status
   */
  getStatus() {
    if (!this.rabbitMQService) {
      return { isInitialized: false, isConnected: false };
    }
    return {
      isInitialized: this.isInitialized,
      ...this.rabbitMQService.getStatus()
    };
  }

  /**
   * Close RabbitMQ connection
   */
  async close() {
    if (this.rabbitMQService) {
      await this.rabbitMQService.close();
      this.isInitialized = false;
      console.log('✅ RabbitMQ manager closed');
    }
  }
}

// Create singleton instance
const rabbitMQManager = new RabbitMQManager();

module.exports = rabbitMQManager;
