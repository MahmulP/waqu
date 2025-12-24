'use client';

import { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Plus, Trash2, Power } from 'lucide-react';

interface SessionListProps {
  sessions: Session[];
  isLoading: boolean;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onDisconnectSession: (sessionId: string) => void;
  isCreating?: boolean;
}

function getStatusBadge(status: Session['status']) {
  const styles = {
    connecting: 'bg-yellow-100 text-yellow-800',
    qr: 'bg-blue-100 text-blue-800',
    connected: 'bg-green-100 text-green-800',
    disconnected: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}

export function SessionList({
  sessions,
  isLoading,
  onCreateSession,
  onDeleteSession,
  onDisconnectSession,
  isCreating,
}: SessionListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>WhatsApp Sessions</CardTitle>
            <CardDescription>Manage your WhatsApp Web connections</CardDescription>
          </div>
          <Button onClick={onCreateSession} disabled={isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sessions yet. Create one to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session ID</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-mono text-sm">
                    {session.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{session.phoneNumber || '-'}</TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                  <TableCell>
                    {new Date(session.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {session.status === 'connected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDisconnectSession(session.id)}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
