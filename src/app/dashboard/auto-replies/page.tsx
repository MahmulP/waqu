'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Plus, Edit, Trash2, Power, PowerOff, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { AutoReplyDialog } from '@/components/auto-reply-dialog';

interface AutoReply {
  id: string;
  name: string;
  matchType: string;
  trigger: string;
  reply: string;
  isActive: boolean;
  caseSensitive: boolean;
  priority: string;
  useAi: boolean;
  aiContext: string | null;
  sessionId: string | null;
  allowedNumbers: string | null;
  createdAt: string;
}

interface AutoReplyLog {
  id: string;
  autoReplyId: string;
  autoReplyName: string;
  senderNumber: string;
  triggerMessage: string;
  sentReply: string;
  createdAt: string;
}

export default function AutoRepliesPage() {
  const [autoReplies, setAutoReplies] = useState<AutoReply[]>([]);
  const [logs, setLogs] = useState<AutoReplyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReply, setEditingReply] = useState<AutoReply | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('rules');

  useEffect(() => {
    // Get selected session from localStorage
    const sessionId = localStorage.getItem('selectedSessionId');
    if (sessionId) {
      setSelectedSessionId(sessionId);
    } else {
      // No session selected, stop loading
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      fetchAutoReplies();
      if (activeTab === 'logs') {
        fetchLogs();
      }
    }
  }, [selectedSessionId, activeTab]);

  const fetchAutoReplies = async () => {
    if (!selectedSessionId) return;
    
    try {
      const response = await fetch(`/api/auto-replies?sessionId=${selectedSessionId}`);
      if (response.ok) {
        const data = await response.json();
        setAutoReplies(data.autoReplies || []);
      }
    } catch (error) {
      console.error('Failed to fetch auto-replies:', error);
      toast.error('Failed to load auto-replies');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    if (!selectedSessionId) return;
    
    setLogsLoading(true);
    try {
      const response = await fetch(`/api/auto-reply-logs?sessionId=${selectedSessionId}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingReply(null);
    setDialogOpen(true);
  };

  const handleEdit = (reply: AutoReply) => {
    setEditingReply(reply);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this auto-reply?')) {
      return;
    }

    try {
      const response = await fetch(`/api/auto-replies/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Auto-reply deleted');
        fetchAutoReplies();
      } else {
        toast.error('Failed to delete auto-reply');
      }
    } catch (error) {
      toast.error('Failed to delete auto-reply');
    }
  };

  const handleToggleActive = async (reply: AutoReply) => {
    try {
      const response = await fetch(`/api/auto-replies/${reply.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reply,
          isActive: !reply.isActive,
        }),
      });

      if (response.ok) {
        toast.success(reply.isActive ? 'Auto-reply deactivated' : 'Auto-reply activated');
        fetchAutoReplies();
      } else {
        toast.error('Failed to update auto-reply');
      }
    } catch (error) {
      toast.error('Failed to update auto-reply');
    }
  };

  const handleSave = () => {
    setDialogOpen(false);
    fetchAutoReplies();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!selectedSessionId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Session Selected</h3>
            <p className="text-gray-500">
              Please select a session from the top bar to manage auto-replies
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auto-Replies</h1>
          <p className="text-gray-500 mt-1">Manage automatic message responses for current session</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Auto-Reply
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Rules ({autoReplies.length})</TabsTrigger>
          <TabsTrigger value="logs">
            <Clock className="h-4 w-4 mr-2" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {autoReplies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No auto-replies yet</h3>
                  <p className="text-gray-500 mb-4">
                    Create your first auto-reply to automatically respond to messages
                  </p>
                  <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Auto-Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {autoReplies.map((reply) => (
                <Card key={reply.id} className={!reply.isActive ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{reply.name}</CardTitle>
                          {reply.useAi && (
                            <Badge variant="default" className="bg-purple-500">
                              AI
                            </Badge>
                          )}
                          <Badge
                            variant={
                              reply.priority === 'high'
                                ? 'destructive'
                                : reply.priority === 'low'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {reply.priority}
                          </Badge>
                          <Badge variant={reply.isActive ? 'default' : 'secondary'}>
                            {reply.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {reply.allowedNumbers && (
                            <Badge variant="outline">
                              Specific Numbers
                            </Badge>
                          )}
                        </div>
                        <CardDescription>
                          Match: <span className="font-mono">{reply.matchType}</span>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(reply)}
                          title={reply.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {reply.isActive ? (
                            <Power className="h-4 w-4 text-green-600" />
                          ) : (
                            <PowerOff className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(reply)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(reply.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Trigger:</div>
                      <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                        {reply.trigger}
                      </div>
                    </div>
                    {reply.allowedNumbers && (
                      <div>
                        <div className="text-sm font-semibold text-gray-700 mb-1">Allowed Numbers:</div>
                        <div className="bg-gray-50 p-3 rounded border text-sm">
                          {reply.allowedNumbers}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        {reply.useAi ? 'AI Context:' : 'Reply:'}
                      </div>
                      <div className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">
                        {reply.useAi ? reply.aiContext || 'No context provided' : reply.reply}
                      </div>
                    </div>
                    {reply.useAi && (
                      <div className="text-xs text-gray-500 italic">
                        AI will generate responses in Bahasa Indonesia based on the context above
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs">
          {logsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : logs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No logs yet</h3>
                  <p className="text-gray-500">
                    Auto-reply logs will appear here when messages are automatically replied
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{log.autoReplyName}</CardTitle>
                        <CardDescription>
                          From: {log.senderNumber} • {new Date(log.createdAt).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Received Message:</div>
                      <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
                        {log.triggerMessage}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-1">Sent Reply:</div>
                      <div className="bg-green-50 p-3 rounded border border-green-200 text-sm whitespace-pre-wrap">
                        {log.sentReply}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AutoReplyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSave}
        editingReply={editingReply}
        sessionId={selectedSessionId}
      />
    </div>
  );
}
