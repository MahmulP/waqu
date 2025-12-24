// Core type definitions for WhatsApp Multi-Session Manager

export type SessionStatus = 'connecting' | 'qr' | 'connected' | 'disconnected';

export interface Session {
  id: string;
  phoneNumber?: string;
  status: SessionStatus;
  createdAt: string;
  lastActive?: string;
}

export interface Message {
  id: string;
  sessionId: string;
  recipient: string;
  content: string;
  timestamp: string;
  status: MessageStatus;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface MessagePayload {
  sessionId: string;
  recipient: string;
  message: string;
  media?: {
    data: string; // base64 encoded
    mimetype: string;
    filename?: string;
  };
}

// Socket.IO event type definitions
export interface ServerToClientEvents {
  'session:qr': (data: { sessionId: string; qr: string }) => void;
  'session:ready': (data: { sessionId: string; phoneNumber: string }) => void;
  'session:disconnected': (data: { sessionId: string }) => void;
  'session:error': (data: { sessionId: string; error: string }) => void;
  'message:sent': (data: { sessionId: string; messageId: string }) => void;
  'message:error': (data: { sessionId: string; error: string }) => void;
  'message:received': (data: { sessionId: string; message: any }) => void;
}

export interface ClientToServerEvents {
  'session:create': (callback: (sessionId: string) => void) => void;
  'session:delete': (sessionId: string) => void;
  'session:disconnect': (sessionId: string) => void;
}

// Error classes
export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class WhatsAppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhatsAppError';
  }
}

// Session metadata for persistence
export interface SessionMetadata {
  id: string;
  phoneNumber?: string;
  createdAt: string;
}

export interface SessionsData {
  sessions: SessionMetadata[];
}
