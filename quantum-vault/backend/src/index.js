const { createServer } = require('http');
const { Server } = require('socket.io');
const { app, initializeApp } = require('./app');
const SocketHandler = require('./socket/socketHandler');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Initialize app (connect to Redis, etc.)
    await initializeApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
      },
    });

    // Initialize socket handler
    const socketHandler = new SocketHandler(io);
    
    // Make io available to routes
    app.set('io', io);
    app.set('socketHandler', socketHandler);

    // Start server on all network interfaces
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════════════╗');
      console.log('║           🔐 Quantum Vault API Server                      ║');
      console.log('╚════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ WebSocket enabled`);
      console.log('');
      console.log('📡 Endpoints:');
      console.log(`   - API:       http://localhost:${PORT}/api`);
      console.log(`   - WebSocket: ws://localhost:${PORT}`);
      console.log(`   - Health:    http://localhost:${PORT}/api/health`);
      console.log(`   - Metrics:   http://localhost:${PORT}/metrics`);
      console.log('');
      console.log('Press Ctrl+C to stop');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
