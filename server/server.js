import { connectDB } from './src/config/db.js';
import { createApp } from './src/app.js';
import { ENV } from './src/config/env.js';

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Initialize App
    const app = createApp();

    // 3. Start Listening
    const server = app.listen(ENV.PORT, () => {
      console.log(`===============================================`);
      console.log(`  CareConnect Backend Service Started`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  Listening on: http://localhost:${ENV.PORT}`);
      console.log(`  Health Check: http://localhost:${ENV.PORT}/api/health`);
      console.log(`===============================================`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('\nShutting down CareConnect server gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error(`Failed to start CareConnect server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
