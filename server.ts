import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { SessionManager } from './src/lib/session-manager';
import { BulkMessageProcessor } from './src/lib/bulk-message-processor';
import type { ServerToClientEvents, ClientToServerEvents } from './src/lib/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: dev ? '*' : process.env.ALLOWED_ORIGINS?.split(',') || [],
      methods: ['GET', 'POST'],
    },
  });

  // Initialize SessionManager
  const sessionManager = new SessionManager(io);
  
  // Make sessionManager available globally for API routes
  (global as any).sessionManager = sessionManager;

  // Initialize session manager
  sessionManager.initialize().catch(console.error);

  // Start bulk message processor (runs every 10 seconds)
  console.log('Starting bulk message processor...');
  const processorInterval = setInterval(() => {
    BulkMessageProcessor.processAll().catch((error) => {
      console.error('Bulk message processor error:', error);
    });
  }, 10000); // Check every 10 seconds

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('session:create', async (callback) => {
      try {
        const sessionId = await sessionManager.createSession();
        callback(sessionId);
      } catch (error: any) {
        console.error('Error creating session:', error);
        socket.emit('session:error', {
          sessionId: '',
          error: error.message,
        });
      }
    });

    socket.on('session:delete', async (sessionId) => {
      try {
        await sessionManager.deleteSession(sessionId);
      } catch (error: any) {
        console.error('Error deleting session:', error);
        socket.emit('session:error', {
          sessionId,
          error: error.message,
        });
      }
    });

    socket.on('session:disconnect', async (sessionId) => {
      try {
        await sessionManager.disconnectSession(sessionId);
      } catch (error: any) {
        console.error('Error disconnecting session:', error);
        socket.emit('session:error', {
          sessionId,
          error: error.message,
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    clearInterval(processorInterval);
    await sessionManager.cleanup();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
