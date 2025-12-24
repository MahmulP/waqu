import { MessagePayload, ValidationError } from './types';

/**
 * Validates WhatsApp phone number format
 * Accepts: digits only (e.g., 6281361626766) or digits@c.us format
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const phoneRegex = /^(\d+@c\.us|\d+)$/;
  return phoneRegex.test(phoneNumber);
}

/**
 * Validates message payload contains all required fields
 */
export function validateMessagePayload(payload: any): payload is MessagePayload {
  if (!payload || typeof payload !== 'object') {
    throw new ValidationError('Payload must be an object');
  }

  if (!payload.sessionId || typeof payload.sessionId !== 'string') {
    throw new ValidationError('sessionId is required and must be a string');
  }

  if (!payload.recipient || typeof payload.recipient !== 'string') {
    throw new ValidationError('recipient is required and must be a string');
  }

  if (!payload.message || typeof payload.message !== 'string') {
    throw new ValidationError('message is required and must be a string');
  }

  if (!validatePhoneNumber(payload.recipient)) {
    throw new ValidationError('recipient must be in WhatsApp format (e.g., 6281361626766 or 1234567890@c.us)');
  }

  return true;
}

/**
 * Validates UUID format for session IDs
 */
export function validateSessionId(sessionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(sessionId);
}

/**
 * Formats a phone number to WhatsApp format if needed
 * Accepts: +1234567890, 1234567890, 6281361626766, or 1234567890@c.us
 * Returns: 1234567890@c.us
 */
export function formatPhoneNumber(phoneNumber: string): string {
  // Already in correct format
  if (phoneNumber.endsWith('@c.us')) {
    return phoneNumber;
  }

  // Remove + and any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.length === 0) {
    throw new ValidationError('Phone number must contain digits');
  }

  return `${cleaned}@c.us`;
}

/**
 * Validates file size (max 1MB for media)
 */
export function validateFileSize(sizeInBytes: number): boolean {
  const maxSize = 1 * 1024 * 1024; // 1MB in bytes
  return sizeInBytes <= maxSize;
}

/**
 * Validates media file type
 */
export function validateMediaType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/3gpp',
    'audio/mpeg',
    'audio/ogg',
    'audio/mp4',
    'application/pdf',
  ];
  return allowedTypes.includes(mimeType);
}
