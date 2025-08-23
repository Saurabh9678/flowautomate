const amqp = require('amqplib');
const RABBITMQ_CONFIG = require('../config/rabbitmq');

class RabbitMQService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
  }

  /**
   * Initialize RabbitMQ connection and setup exchange/queues
   */
  async initialize() {
    try {
      console.log('🔄 Initializing RabbitMQ connection...');
      
      // Create connection
      this.connection = await amqp.connect(RABBITMQ_CONFIG.url, RABBITMQ_CONFIG.options);
      
      // Handle connection events
      this.connection.on('error', (error) => {
        console.error('❌ RabbitMQ connection error:', error);
        this.isConnected = false;
        this.handleReconnect();
      });

      this.connection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });

      // Create channel
      this.channel = await this.connection.createChannel();
      
      // Handle channel events
      this.channel.on('error', (error) => {
        console.error('❌ RabbitMQ channel error:', error);
      });

      this.channel.on('return', (msg) => {
        console.warn('⚠️ RabbitMQ message returned:', msg);
      });

      // Setup exchange
      await this.setupExchange();
      
      // Setup queues
      await this.setupQueues();
      
      // Setup bindings
      await this.setupBindings();

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ RabbitMQ connection established successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize RabbitMQ:', error);
      this.handleReconnect();
      throw error;
    }
  }

  /**
   * Setup the exchange
   */
  async setupExchange() {
    try {
      await this.channel.assertExchange(
        RABBITMQ_CONFIG.exchange.name,
        RABBITMQ_CONFIG.exchange.type,
        {
          durable: RABBITMQ_CONFIG.exchange.durable
        }
      );
      console.log('✅ Exchange setup completed:', RABBITMQ_CONFIG.exchange.name);
    } catch (error) {
      console.error('❌ Failed to setup exchange:', error);
      throw error;
    }
  }

  /**
   * Setup all queues
   */
  async setupQueues() {
    try {
      const queueNames = Object.keys(RABBITMQ_CONFIG.queues);
      
      for (const queueKey of queueNames) {
        const queue = RABBITMQ_CONFIG.queues[queueKey];
        
        await this.channel.assertQueue(queue.name, {
          durable: queue.durable
        });
        
        console.log('✅ Queue setup completed:', queue.name);
      }
    } catch (error) {
      console.error('❌ Failed to setup queues:', error);
      throw error;
    }
  }

  /**
   * Setup bindings between exchange and queues
   */
  async setupBindings() {
    try {
      const queueNames = Object.keys(RABBITMQ_CONFIG.queues);
      
      for (const queueKey of queueNames) {
        const queue = RABBITMQ_CONFIG.queues[queueKey];
        
        await this.channel.bindQueue(
          queue.name,
          RABBITMQ_CONFIG.exchange.name,
          queue.routingKey
        );
        
        console.log('✅ Binding setup completed:', `${queue.name} -> ${queue.routingKey}`);
      }
    } catch (error) {
      console.error('❌ Failed to setup bindings:', error);
      throw error;
    }
  }

  /**
   * Send message to queue
   */
  async sendMessage(queueName, message, options = {}) {
    try {
      if (!this.isConnected || !this.channel) {
        throw new Error('RabbitMQ not connected');
      }

      const queue = RABBITMQ_CONFIG.queues[queueName];
      if (!queue) {
        throw new Error(`Queue '${queueName}' not found in configuration`);
      }

      // Prepare message
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      // Default options
      const defaultOptions = {
        persistent: true,
        timestamp: Date.now()
      };

      const finalOptions = { ...defaultOptions, ...options };

      // Publish to exchange with routing key
      const result = this.channel.publish(
        RABBITMQ_CONFIG.exchange.name,
        queue.routingKey,
        messageBuffer,
        finalOptions
      );

      if (result) {
        console.log(`✅ Message sent to queue '${queue.name}' with routing key '${queue.routingKey}'`);
        return true;
      } else {
        console.warn(`⚠️ Message not sent to queue '${queue.name}' - channel write buffer is full`);
        return false;
      }

    } catch (error) {
      console.error('❌ Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send PDF parsed message
   */
  async sendPdfParsedMessage(data) {
    const message = {
      type: RABBITMQ_CONFIG.queues.pdfParsed.name,
      timestamp: new Date().toISOString(),
      data: data
    };

    return await this.sendMessage('pdfParsed', message);
  }

  /**
   * Handle reconnection
   */
  async handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
      }
    }, this.reconnectDelay);
  }

  /**
   * Close connection
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        console.log('✅ RabbitMQ channel closed');
      }

      if (this.connection) {
        await this.connection.close();
        console.log('✅ RabbitMQ connection closed');
      }

      this.isConnected = false;
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

module.exports = RabbitMQService;
