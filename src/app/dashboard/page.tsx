'use client';

import { useEffect, useState } from 'react';
import { useSessionsQuery } from '@/hooks/use-sessions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, CheckCircle, Clock, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: sessions = [] } = useSessionsQuery();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  // Get selected session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedSessionId');
    if (saved) {
      setSelectedSessionId(saved);
    }
  }, []);

  const connectedSessions = sessions.filter(s => s.status === 'connected');
  const connectingSessions = sessions.filter(s => s.status === 'connecting' || s.status === 'qr');
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your WhatsApp sessions</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-gray-500 mt-1">All WhatsApp sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{connectedSessions.length}</div>
            <p className="text-xs text-gray-500 mt-1">Ready to send messages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connecting</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{connectingSessions.length}</div>
            <p className="text-xs text-gray-500 mt-1">Waiting for QR scan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Smartphone className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-blue-600 truncate">
              {selectedSession?.phoneNumber || selectedSession?.id.substring(0, 8) || 'None'}
            </div>
            <p className="text-xs text-gray-500 mt-1 capitalize">
              {selectedSession?.status || 'No session selected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/send">
            <Button className="w-full" size="lg">
              <MessageSquare className="h-5 w-5 mr-2" />
              Send Message
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="w-full" disabled>
            <Users className="h-5 w-5 mr-2" />
            Manage Contacts (Coming Soon)
          </Button>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Sessions</CardTitle>
          <CardDescription>Manage your WhatsApp connections</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first WhatsApp session to start sending messages
              </p>
              <p className="text-sm text-gray-400">
                Click the "New" button in the top bar to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className={`p-4 border rounded-lg transition-all ${
                    session.id === selectedSessionId 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Status Indicator */}
                      <div className="relative">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          session.status === 'connected' ? 'bg-green-100' :
                          session.status === 'connecting' ? 'bg-yellow-100' :
                          session.status === 'qr' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Smartphone className={`h-6 w-6 ${
                            session.status === 'connected' ? 'text-green-600' :
                            session.status === 'connecting' ? 'text-yellow-600' :
                            session.status === 'qr' ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${
                          session.status === 'connected' ? 'bg-green-500' :
                          session.status === 'connecting' ? 'bg-yellow-500' :
                          session.status === 'qr' ? 'bg-blue-500' : 'bg-gray-500'
                        }`} />
                      </div>

                      {/* Session Info */}
                      <div>
                        <div className="font-semibold text-gray-900">
                          {session.phoneNumber || `Session ${session.id.substring(0, 8)}`}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          Status: {session.status}
                        </div>
                        {session.lastActive && (
                          <div className="text-xs text-gray-400">
                            Last active: {new Date(session.lastActive).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Badge */}
                    {session.id === selectedSessionId && (
                      <div className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                        Selected
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
