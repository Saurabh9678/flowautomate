const app = require('./src/app');
const Database = require('./src/utils/database');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await Database.connect();
    
    // Sync database schema with models
    // Always use alter sync to safely apply schema changes
    console.log('✅ Alter sync enabled - schema changes will be applied safely');
    await Database.sync({ alter: true });

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
