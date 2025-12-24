'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Session } from '@/lib/types';

async function fetchSessions(): Promise<Session[]> {
  const response = await fetch('/api/sessions');
  if (!response.ok) {
    throw new Error('Failed to fetch sessions');
  }
  const data = await response.json();
  return data.sessions;
}

async function createSession(): Promise<{ sessionId: string; status: string }> {
  const response = await fetch('/api/sessions', {
    method: 'POST',
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to create session');
  }
  const data = await response.json();
  return { sessionId: data.sessionId, status: data.status };
}

async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete session');
  }
}

export function useSessionsQuery() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: fetchSessions,
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useCreateSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}

export function useDeleteSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
