import { Client, LocalAuth, Message as WAMessage, MessageMedia } from 'whatsapp-web.js';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import {
  Session,
  SessionStatus,
  SessionNotFoundError,
  WhatsAppError,
  ServerToClientEvents,
  ClientToServerEvents,
} from './types';
import {
  loadSessionMetadata,
  addSessionMetadata,
  updateSessionMetadata,
  removeSessionMetadata,
} from './persistence';
import { validateMessagePayload, formatPhoneNumber } from './validation';

interface MessageQueue {
  recipient: string;
  message: string;
  media?: { data: string; mimetype: string; filename?: string };
  resolve: (messageId: string) => void;
  reject: (error: Error) => void;
}

export class SessionManager {
  private clients: Map<string, Client> = new Map();
  private sessions: Map<string, Session> = new Map();
  private messageQueues: Map<string, MessageQueue[]> = new Map();
  private processingQueues: Map<string, boolean> = new Map();
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private initializationTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly MAX_SESSIONS = 20;
  private readonly INIT_TIMEOUT = 180000; // 180 seconds (3 minutes)
  private readonly QR_TIMEOUT = 90000; // 90 seconds
  private readonly MESSAGE_TIMEOUT = 30000; // 30 seconds

  constructor(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  /**
   * Initialize the session manager and restore previous sessions
   */
  async initialize(): Promise<void> {
    console.log('Initializing SessionManager...');
    await this.restoreSessions();
  }

  /**
   * Creates a new WhatsApp session
   */
  async createSession(): Promise<string> {
    if (this.clients.size >= this.MAX_SESSIONS) {
      throw new Error(`Maximum session limit reached (${this.MAX_SESSIONS})`);
    }

    const sessionId = uuidv4();
    console.log(`Creating session: ${sessionId}`);

    // Initialize session state
    const session: Session = {
      id: sessionId,
      status: 'connecting',
      createdAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, session);
    this.messageQueues.set(sessionId, []);

    // Save metadata
    await addSessionMetadata({
      id: sessionId,
      createdAt: session.createdAt,
    });

    // Initialize WhatsApp client
    await this.initializeClient(sessionId);

    return sessionId;
  }

  /**
   * Initializes a WhatsApp client for a session
   */
  private async initializeClient(sessionId: string): Promise<void> {
    try {
      const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      });

      // Set initialization timeout
      const timeout = setTimeout(() => {
        this.handleInitializationTimeout(sessionId);
      }, this.INIT_TIMEOUT);

      this.initializationTimeouts.set(sessionId, timeout);

      // Set up event handlers
      client.on('qr', (qr: string) => this.handleQRCode(sessionId, qr));
      client.on('ready', () => this.handleReady(sessionId, client));
      client.on('authenticated', () => this.handleAuthenticated(sessionId));
      client.on('auth_failure', (msg: string) => this.handleAuthFailure(sessionId, msg));
      client.on('disconnected', (reason: string) => this.handleDisconnected(sessionId, reason));
      client.on('message', (msg: WAMessage) => this.handleMessageReceived(sessionId, msg));

      this.clients.set(sessionId, client);

      // Initialize the client
      await client.initialize();
    } catch (error: any) {
      console.error(`Failed to initialize client for session ${sessionId}:`, error);
      this.clearInitializationTimeout(sessionId);
      
      const session = this.sessions.get(sessionId);
      if (session) {
        session.status = 'disconnected';
        this.sessions.set(sessionId, session);
      }

      this.io.emit('session:error', {
        sessionId,
        error: `Initialization failed: ${error.message}`,
      });

      throw new WhatsAppError(`Failed to initialize session: ${error.message}`);
    }
  }

  /**
   * Handles QR code generation
   */
  private handleQRCode(sessionId: string, qr: string): void {
    console.log(`QR code generated for session: ${sessionId}`);
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'qr';
      this.sessions.set(sessionId, session);
    }

    this.io.emit('session:qr', { sessionId, qr });
  }

  /**
   * Handles successful authentication
   */
  private handleAuthenticated(sessionId: string): void {
    console.log(`Session authenticated: ${sessionId}`);
  }

  /**
   * Handles when client is ready
   */
  private async handleReady(sessionId: string, client: Client): Promise<void> {
    this.clearInitializationTimeout(sessionId);
    
    const info = client.info;
    const phoneNumber = info?.wid?.user || 'unknown';
    
    console.log(`Session ready: ${sessionId}, Phone: ${phoneNumber}`);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'connected';
      session.phoneNumber = phoneNumber;
      session.lastActive = new Date().toISOString();
      this.sessions.set(sessionId, session);
    }

    // Update metadata
    await updateSessionMetadata(sessionId, { phoneNumber });

    // Update database
    try {
      const { getDbConnection } = await import('./db');
      const { sessions } = await import('./db/schema');
      const { eq } = await import('drizzle-orm');
      
      const { db } = await getDbConnection();
      await db.update(sessions)
        .set({
          phoneNumber,
          status: 'connected',
          lastActive: new Date(),
        })
        .where(eq(sessions.id, sessionId));
    } catch (error) {
      console.error('Failed to update session in database:', error);
    }

    this.io.emit('session:ready', { sessionId, phoneNumber });
  }

  /**
   * Handles authentication failure
   */
  private handleAuthFailure(sessionId: string, msg: string): void {
    console.error(`Auth failure for session ${sessionId}:`, msg);
    this.clearInitializationTimeout(sessionId);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'disconnected';
      this.sessions.set(sessionId, session);
    }

    this.io.emit('session:error', {
      sessionId,
      error: `Authentication failed: ${msg}`,
    });
  }

  /**
   * Handles disconnection
   */
  private handleDisconnected(sessionId: string, reason: string): void {
    console.log(`Session disconnected: ${sessionId}, Reason: ${reason}`);
    this.clearInitializationTimeout(sessionId);

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'disconnected';
      this.sessions.set(sessionId, session);
    }

    this.io.emit('session:disconnected', { sessionId });
  }

  /**
   * Handles initialization timeout
   */
  private handleInitializationTimeout(sessionId: string): void {
    console.error(`Initialization timeout for session: ${sessionId}`);
    
    const session = this.sessions.get(sessionId);
    if (session) {
      // If QR was generated, keep it in QR state, otherwise mark as disconnected
      if (session.status !== 'qr') {
        session.status = 'disconnected';
        this.sessions.set(sessionId, session);
      } else {
        console.log(`Session ${sessionId} still waiting for QR scan, keeping in QR state`);
      }
    }

    this.io.emit('session:error', {
      sessionId,
      error: session?.status === 'qr' 
        ? 'Please scan the QR code to connect' 
        : 'Session initialization timeout',
    });

    // Only destroy client if no QR was generated
    if (session?.status !== 'qr') {
      const client = this.clients.get(sessionId);
      if (client) {
        client.destroy().catch(console.error);
      }
    }
  }

  /**
   * Clears initialization timeout
   */
  private clearInitializationTimeout(sessionId: string): void {
    const timeout = this.initializationTimeouts.get(sessionId);
    if (timeout) {
      clearTimeout(timeout);
      this.initializationTimeouts.delete(sessionId);
    }
  }

  /**
   * Handles received messages
   */
  private async handleMessageReceived(sessionId: string, message: WAMessage): Promise<void> {
    console.log('Message received:', sessionId, message.from);
    
    // Don't auto-reply to own messages
    if (message.fromMe) {
      return;
    }
    
    // Save to database
    try {
      const { getDbConnection } = await import('./db');
      const { messages, sessions, autoReplies } = await import('./db/schema');
      const { eq, and } = await import('drizzle-orm');
      const { AutoReplyMatcher } = await import('./auto-reply-matcher');
      
      const { db } = await getDbConnection();
      
      // Get session to find userId
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);
      
      if (session && session.userId) {
        // Save message
        await db.insert(messages).values({
          id: message.id._serialized,
          sessionId,
          userId: session.userId,
          from: message.from,
          to: message.to || '',
          body: message.body || '',
          type: message.type || 'chat',
          hasMedia: message.hasMedia || false,
          timestamp: new Date(message.timestamp * 1000),
          isFromMe: message.fromMe || false,
        }).onDuplicateKeyUpdate({
          set: { body: message.body || '' }
        });
        
        console.log('Message saved to database:', message.id._serialized);

        // Check for auto-reply rules
        if (message.body && message.type === 'chat') {
          // Get active auto-replies for this user/session
          const rules = await db
            .select()
            .from(autoReplies)
            .where(
              and(
                eq(autoReplies.userId, session.userId),
                eq(autoReplies.isActive, true),
              )
            );

          // Filter by session (include global rules)
          const applicableRules = rules.filter(
            (rule: typeof autoReplies.$inferSelect) => !rule.sessionId || rule.sessionId === sessionId
          );

          if (applicableRules.length > 0) {
            const matchResult = AutoReplyMatcher.findMatch(message.body, applicableRules);
            
            if (matchResult.matched && matchResult.reply) {
              console.log('Auto-reply matched:', matchResult.reply.name);
              
              // Check if sender number is allowed (if allowedNumbers is set)
              const senderNumber = message.from.replace('@c.us', '');
              if (matchResult.reply.allowedNumbers) {
                const allowedNumbers = matchResult.reply.allowedNumbers
                  .split(',')
                  .map(num => num.trim())
                  .filter(num => num.length > 0);
                
                if (allowedNumbers.length > 0 && !allowedNumbers.includes(senderNumber)) {
                  console.log(`Sender ${senderNumber} not in allowed numbers list, skipping auto-reply`);
                  return;
                }
              }
              
              // Get user's AI API key if AI reply is enabled
              let aiApiKey;
              if (matchResult.reply.useAi) {
                const { users } = await import('./db/schema');
                const { EncryptionService } = await import('./encryption');
                
                const [user] = await db
                  .select({
                    aiApiKey: users.aiApiKey,
                  })
                  .from(users)
                  .where(eq(users.id, session.userId))
                  .limit(1);
                
                if (user && user.aiApiKey) {
                  try {
                    // Decrypt the API key
                    aiApiKey = EncryptionService.decrypt(user.aiApiKey);
                  } catch (error) {
                    console.error('Failed to decrypt API key:', error);
                  }
                }
              }

              // Process reply message with variables or AI
              const replyText = await AutoReplyMatcher.processReplyMessage(
                matchResult.reply,
                {
                  senderNumber: message.from.replace('@c.us', ''),
                  messageText: message.body,
                },
                aiApiKey
              );

              // Send auto-reply
              try {
                await this.sendMessage(sessionId, message.from, replyText);
                console.log('Auto-reply sent successfully');
                
                // Log the auto-reply
                const { autoReplyLogs } = await import('./db/schema');
                const { v4: uuidv4 } = await import('uuid');
                
                await db.insert(autoReplyLogs).values({
                  id: uuidv4(),
                  autoReplyId: matchResult.reply.id,
                  sessionId,
                  userId: session.userId,
                  senderNumber: message.from.replace('@c.us', ''),
                  triggerMessage: message.body,
                  sentReply: replyText,
                });
                
                console.log('Auto-reply logged to database');
              } catch (error) {
                console.error('Failed to send auto-reply:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to process received message:', error);
    }
    
    this.io.emit('message:received', {
      sessionId,
      message: {
        id: message.id._serialized,
        from: message.from,
        body: message.body,
        timestamp: message.timestamp,
      },
    });
  }

  /**
   * Sends a message through a session
   */
  async sendMessage(
    sessionId: string,
    recipient: string,
    message: string,
    media?: { data: string; mimetype: string; filename?: string }
  ): Promise<string> {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new SessionNotFoundError(sessionId);
    }

    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'connected') {
      throw new Error(`Session ${sessionId} is not connected`);
    }

    // Format phone number
    const formattedRecipient = formatPhoneNumber(recipient);

    // Add to queue
    return new Promise((resolve, reject) => {
      const queue = this.messageQueues.get(sessionId) || [];
      queue.push({ recipient: formattedRecipient, message, media, resolve, reject });
      this.messageQueues.set(sessionId, queue);
      
      // Process queue
      this.processMessageQueue(sessionId);
    });
  }

  /**
   * Processes message queue for a session (FIFO)
   */
  private async processMessageQueue(sessionId: string): Promise<void> {
    // Check if already processing
    if (this.processingQueues.get(sessionId)) {
      return;
    }

    this.processingQueues.set(sessionId, true);

    const queue = this.messageQueues.get(sessionId);
    if (!queue || queue.length === 0) {
      this.processingQueues.set(sessionId, false);
      return;
    }

    const client = this.clients.get(sessionId);
    if (!client) {
      // Clear queue with errors
      queue.forEach(item => item.reject(new SessionNotFoundError(sessionId)));
      this.messageQueues.set(sessionId, []);
      this.processingQueues.set(sessionId, false);
      return;
    }

    // Process first message in queue
    const item = queue.shift()!;
    this.messageQueues.set(sessionId, queue);

    try {
      let sentMessage;

      if (item.media) {
        // Send message with media
        const media = new MessageMedia(
          item.media.mimetype,
          item.media.data,
          item.media.filename
        );

        sentMessage = await Promise.race([
          client.sendMessage(item.recipient, media, { caption: item.message || undefined }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Message send timeout')), this.MESSAGE_TIMEOUT)
          ),
        ]);
      } else {
        // Send text message
        sentMessage = await Promise.race([
          client.sendMessage(item.recipient, item.message),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Message send timeout')), this.MESSAGE_TIMEOUT)
          ),
        ]);
      }

      const messageId = sentMessage.id._serialized;
      
      this.io.emit('message:sent', { sessionId, messageId });
      item.resolve(messageId);
    } catch (error: any) {
      console.error(`Failed to send message for session ${sessionId}:`, error);
      
      this.io.emit('message:error', {
        sessionId,
        error: error.message,
      });
      
      item.reject(new WhatsAppError(error.message));
    }

    this.processingQueues.set(sessionId, false);

    // Process next message if any
    if (queue.length > 0) {
      setImmediate(() => this.processMessageQueue(sessionId));
    }
  }

  /**
   * Gets all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Gets a specific session
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Disconnects a session
   */
  async disconnectSession(sessionId: string): Promise<void> {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new SessionNotFoundError(sessionId);
    }

    console.log(`Disconnecting session: ${sessionId}`);

    try {
      await client.logout();
      await client.destroy();
    } catch (error) {
      console.error(`Error disconnecting session ${sessionId}:`, error);
    }

    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'disconnected';
      this.sessions.set(sessionId, session);
    }

    this.clients.delete(sessionId);
    this.clearInitializationTimeout(sessionId);

    this.io.emit('session:disconnected', { sessionId });
  }

  /**
   * Deletes a session completely
   */
  async deleteSession(sessionId: string): Promise<void> {
    console.log(`Deleting session: ${sessionId}`);

    // Disconnect if connected
    if (this.clients.has(sessionId)) {
      try {
        await this.disconnectSession(sessionId);
      } catch (error) {
        console.error(`Error during disconnect while deleting ${sessionId}:`, error);
      }
    }

    // Remove from memory
    this.sessions.delete(sessionId);
    this.clients.delete(sessionId);
    this.messageQueues.delete(sessionId);
    this.processingQueues.delete(sessionId);
    this.clearInitializationTimeout(sessionId);

    // Remove from persistent storage
    await removeSessionMetadata(sessionId);
  }

  /**
   * Restores sessions from persistent storage
   */
  private async restoreSessions(): Promise<void> {
    try {
      const metadata = await loadSessionMetadata();
      console.log(`Restoring ${metadata.length} sessions...`);

      for (const meta of metadata) {
        try {
          const session: Session = {
            id: meta.id,
            phoneNumber: meta.phoneNumber,
            status: 'connecting',
            createdAt: meta.createdAt,
          };

          this.sessions.set(meta.id, session);
          this.messageQueues.set(meta.id, []);

          // Try to restore the client
          await this.initializeClient(meta.id);
        } catch (error) {
          console.error(`Failed to restore session ${meta.id}:`, error);
          
          // Mark as disconnected
          const session = this.sessions.get(meta.id);
          if (session) {
            session.status = 'disconnected';
            this.sessions.set(meta.id, session);
          }
        }
      }

      console.log('Session restoration complete');
    } catch (error) {
      console.error('Failed to restore sessions:', error);
    }
  }

  /**
   * Cleanup all sessions (for graceful shutdown)
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up all sessions...');
    
    const promises = Array.from(this.clients.keys()).map(sessionId =>
      this.disconnectSession(sessionId).catch(console.error)
    );

    await Promise.all(promises);
    console.log('Cleanup complete');
  }
}
