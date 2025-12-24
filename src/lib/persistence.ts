import { promises as fs } from 'fs';
import path from 'path';
import { SessionMetadata, SessionsData } from './types';

const SESSIONS_FILE = path.join(process.cwd(), '.wwebjs_auth', 'sessions.json');

/**
 * Ensures the storage directory exists
 */
async function ensureStorageDir(): Promise<void> {
  const dir = path.dirname(SESSIONS_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    console.error('Failed to create storage directory:', error);
  }
}

/**
 * Loads session metadata from persistent storage
 */
export async function loadSessionMetadata(): Promise<SessionMetadata[]> {
  try {
    await ensureStorageDir();
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
    const parsed: SessionsData = JSON.parse(data);
    return parsed.sessions || [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty array
      return [];
    }
    console.error('Failed to load session metadata:', error);
    return [];
  }
}

/**
 * Saves session metadata to persistent storage
 */
export async function saveSessionMetadata(sessions: SessionMetadata[]): Promise<void> {
  try {
    await ensureStorageDir();
    const data: SessionsData = { sessions };
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save session metadata:', error);
    throw error;
  }
}

/**
 * Adds a new session to metadata
 */
export async function addSessionMetadata(session: SessionMetadata): Promise<void> {
  const sessions = await loadSessionMetadata();
  sessions.push(session);
  await saveSessionMetadata(sessions);
}

/**
 * Updates an existing session in metadata
 */
export async function updateSessionMetadata(sessionId: string, updates: Partial<SessionMetadata>): Promise<void> {
  const sessions = await loadSessionMetadata();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    await saveSessionMetadata(sessions);
  }
}

/**
 * Removes a session from metadata
 */
export async function removeSessionMetadata(sessionId: string): Promise<void> {
  const sessions = await loadSessionMetadata();
  const filtered = sessions.filter(s => s.id !== sessionId);
  await saveSessionMetadata(filtered);
}
