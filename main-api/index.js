const app = require('./src/app');
const Database = require('./src/utils/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await Database.connect();
    
    // Validate that database schema matches models
    await Database.validateSchema();
    
    console.log('✅ Database connected and schema validated');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await Database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await Database.close();
  process.exit(0);
});

startServer();
