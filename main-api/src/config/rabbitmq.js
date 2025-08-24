const amqp = require('amqplib');

// RabbitMQ Configuration
const RABBITMQ_CONFIG = {
  // Build URL with authentication if credentials are provided
  url: process.env.RABBITMQ_URL || 
       (process.env.RABBITMQ_USERNAME && process.env.RABBITMQ_PASSWORD) 
         ? `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST || 'localhost'}:${process.env.RABBITMQ_PORT || '5672'}`
         : 'amqp://localhost:5672',
  
  exchange: {
    name: 'pdf.exchange',
    type: 'direct',
    durable: true
  },
  queues: {
    pdfParsed: {
      name: 'pdf.parsed',
      durable: true,
      routingKey: 'pdf.parsed'
    }
  },
  options: {
    heartbeat: 60,
    connectionTimeout: 30000,
    channelMax: 0,
    frameMax: 0
  }
};

module.exports = RABBITMQ_CONFIG;
