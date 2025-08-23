const amqp = require('amqplib');

// RabbitMQ Configuration
const RABBITMQ_CONFIG = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
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
