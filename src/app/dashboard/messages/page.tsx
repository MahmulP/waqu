'use client';

import { useEffect, useState } from 'react';
import { useSessionsQuery } from '@/hooks/use-sessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, MessageSquare, Phone, Clock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface Message {
  id: string;
  sessionId: string;
  from: string;
  to: string | null;
  body: string | null;
  type: string;
  hasMedia: boolean;
  timestamp: string;
  isFromMe: boolean;
  createdAt: string;
  sessionPhoneNumber: string | null;
}

async function fetchMessages(sessionId?: string): Promise<Message[]> {
  const url = sessionId 
    ? `/api/messages?sessionId=${sessionId}` 
    : '/api/messages';
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  const data = await response.json();
  return data.messages;
}

export default function MessagesPage() {
  const { data: sessions = [] } = useSessionsQuery();
  const [filterSession, setFilterSession] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['messages', filterSession === 'all' ? undefined : filterSession],
    queryFn: () => fetchMessages(filterSession === 'all' ? undefined : filterSession),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Filter messages by search query
  const filteredMessages = messages.filter(msg => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      msg.from.toLowerCase().includes(query) ||
      msg.body?.toLowerCase().includes(query) ||
      msg.to?.toLowerCase().includes(query)
    );
  });

  const formatPhoneNumber = (phone: string) => {
    // Remove @c.us suffix
    return phone.replace('@c.us', '');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Message Logs</h1>
        <p className="text-gray-600 mt-1">View all received WhatsApp messages</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages, phone numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterSession} onValueChange={setFilterSession}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Filter by session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.phoneNumber || session.id.substring(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
          <CardDescription>Recent messages from all your sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'No messages match your search'
                  : 'Messages will appear here when you receive them'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">From</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Session</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMessages.map((msg) => (
                    <tr key={msg.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {formatPhoneNumber(msg.from)}
                            </div>
                            {msg.isFromMe && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {msg.sessionPhoneNumber || msg.sessionId.substring(0, 8)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-md">
                          <p className="text-sm text-gray-900 truncate">
                            {msg.body || <span className="text-gray-400 italic">No text</span>}
                          </p>
                          {msg.hasMedia && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Has Media
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="capitalize">
                          {msg.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
