'use client';

import { useMutation } from '@tanstack/react-query';
import { MessagePayload } from '@/lib/types';

async function sendMessage(payload: MessagePayload): Promise<string> {
  console.log('Sending message with payload:', {
    ...payload,
    media: payload.media ? { ...payload.media, data: `${payload.media.data.substring(0, 50)}...` } : undefined
  });

  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to send message');
  }

  return data.messageId;
}

export function useSendMessageMutation() {
  return useMutation({
    mutationFn: sendMessage,
    retry: 2,
    retryDelay: 1000,
  });
}
