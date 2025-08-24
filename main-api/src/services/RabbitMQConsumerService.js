const amqp = require('amqplib');
const RABBITMQ_CONFIG = require('../config/rabbitmq');

class RabbitMQConsumerService {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.consumerTag = null;
  }

  /**
   * Initialize RabbitMQ connection and channel
   */
  async initialize() {
    try {
      console.log('🔄 Initializing RabbitMQ Consumer...');
      
      // Create connection
      this.connection = await amqp.connect(RABBITMQ_CONFIG.url);
      console.log('✅ RabbitMQ Consumer connection established');

      // Create channel
      this.channel = await this.connection.createChannel();
      console.log('✅ RabbitMQ Consumer channel created');

      // Setup exchange
      await this.setupExchange();
      
      // Setup queue
      await this.setupQueue();
      
      // Setup binding
      await this.setupBinding();
      
      // Start consuming messages
      await this.startConsuming();
      
      this.isConnected = true;
      console.log('✅ RabbitMQ Consumer initialized successfully');

      // Handle connection close
      this.connection.on('close', () => {
        console.log('❌ RabbitMQ Consumer connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });

      // Handle channel close
      this.channel.on('close', () => {
        console.log('❌ RabbitMQ Consumer channel closed');
        this.handleReconnect();
      });

    } catch (error) {
      console.error('❌ Failed to initialize RabbitMQ Consumer:', error.message);
      throw error;
    }
  }

  /**
   * Setup exchange
   */
  async setupExchange() {
    try {
      await this.channel.assertExchange(
        RABBITMQ_CONFIG.exchange.name,
        RABBITMQ_CONFIG.exchange.type,
        RABBITMQ_CONFIG.exchange.options
      );
      console.log(`✅ Exchange '${RABBITMQ_CONFIG.exchange.name}' setup complete`);
    } catch (error) {
      console.error('❌ Failed to setup exchange:', error.message);
      throw error;
    }
  }

  /**
   * Setup queue
   */
  async setupQueue() {
    try {
      const queueConfig = RABBITMQ_CONFIG.queues.pdfParsed;
      await this.channel.assertQueue(
        queueConfig.name,
        queueConfig.options
      );
      console.log(`✅ Queue '${queueConfig.name}' setup complete`);
    } catch (error) {
      console.error('❌ Failed to setup queue:', error.message);
      throw error;
    }
  }

  /**
   * Setup binding between exchange and queue
   */
  async setupBinding() {
    try {
      const queueConfig = RABBITMQ_CONFIG.queues.pdfParsed;
      await this.channel.bindQueue(
        queueConfig.name,
        RABBITMQ_CONFIG.exchange.name,
        queueConfig.routingKey
      );
      console.log(`✅ Binding setup complete: ${RABBITMQ_CONFIG.exchange.name} -> ${queueConfig.name} (${queueConfig.routingKey})`);
    } catch (error) {
      console.error('❌ Failed to setup binding:', error.message);
      throw error;
    }
  }

  /**
   * Start consuming messages
   */
  async startConsuming() {
    try {
      const queueConfig = RABBITMQ_CONFIG.queues.pdfParsed;
      
      // Set QoS (Quality of Service) - process one message at a time
      await this.channel.prefetch(1);
      
      // Start consuming
      const result = await this.channel.consume(queueConfig.name, (msg) => {
        this.handleMessage(msg);
      }, {
        noAck: false // Manual acknowledgment
      });
      
      this.consumerTag = result.consumerTag;
      console.log(`✅ Started consuming from queue '${queueConfig.name}'`);
      console.log(`📋 Consumer tag: ${this.consumerTag}`);
      
    } catch (error) {
      console.error('❌ Failed to start consuming:', error.message);
      throw error;
    }
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(msg) {
    try {
      if (!msg) {
        console.log('⚠️ Received null message');
        return;
      }

      // Parse message content
      const content = JSON.parse(msg.content.toString());
      
      console.log('\n📨 Received PDF Parsed Message:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 Message Type: ${content.type}`);
      console.log(`⏰ Timestamp: ${content.timestamp}`);
      console.log('📊 Data:');
      console.log(`   📋 PDF ID: ${content.data.pdfId}`);
      console.log(`   👤 User ID: ${content.data.userId}`);
      console.log(`   📁 Filename: ${content.data.filename}`);
      console.log(`   📄 JSON Path: ${content.data.jsonPath}`);
      console.log(`   📖 Page Count: ${content.data.pageCount}`);
      console.log(`   📝 Text Length: ${content.data.textLength}`);
      console.log(`   📊 Table Count: ${content.data.tableCount}`);
      console.log(`   🕐 Parsed At: ${content.data.parsedAt}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Acknowledge the message
      this.channel.ack(msg);
      console.log('✅ Message acknowledged successfully');

    } catch (error) {
      console.error('❌ Error processing message:', error.message);
      
      // Reject the message and requeue it
      this.channel.nack(msg, false, true);
      console.log('🔄 Message rejected and requeued');
    }
  }

  /**
   * Handle reconnection
   */
  async handleReconnect() {
    if (this.isConnected) return;
    
    console.log('🔄 Attempting to reconnect RabbitMQ Consumer...');
    
    try {
      await this.initialize();
    } catch (error) {
      console.error('❌ Reconnection failed:', error.message);
      
      // Retry after 5 seconds
      setTimeout(() => {
        this.handleReconnect();
      }, 5000);
    }
  }

  /**
   * Stop consuming messages
   */
  async stopConsuming() {
    try {
      if (this.consumerTag) {
        await this.channel.cancel(this.consumerTag);
        console.log('🛑 Stopped consuming messages');
        this.consumerTag = null;
      }
    } catch (error) {
      console.error('❌ Error stopping consumer:', error.message);
    }
  }

  /**
   * Close connection
   */
  async close() {
    try {
      console.log('🛑 Closing RabbitMQ Consumer...');
      
      // Stop consuming
      await this.stopConsuming();
      
      // Close channel
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      
      // Close connection
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      
      this.isConnected = false;
      console.log('✅ RabbitMQ Consumer closed successfully');
      
    } catch (error) {
      console.error('❌ Error closing RabbitMQ Consumer:', error.message);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      hasChannel: !!this.channel,
      hasConnection: !!this.connection,
      consumerTag: this.consumerTag
    };
  }
}

module.exports = RabbitMQConsumerService;
