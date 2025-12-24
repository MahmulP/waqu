'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/hooks/use-socket';
import { useSessionsQuery, useCreateSessionMutation } from '@/hooks/use-sessions';
import { Button } from '@/components/ui/button';
import QRCode from 'qrcode';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, LogOut, MessageSquare, LayoutDashboard, Settings, Menu, X, Inbox, Zap } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { socket, isConnected } = useSocket();
  const { data: sessions = [], isLoading } = useSessionsQuery();
  const createSessionMutation = useCreateSessionMutation();
  
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [qrCodes, setQrCodes] = useState<Map<string, string>>(new Map());
  const [qrImages, setQrImages] = useState<Map<string, string>>(new Map());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch user
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Socket listeners
  useEffect(() => {
    if (!socket) {
      console.log('Socket not connected yet');
      return;
    }

    console.log('Setting up socket listeners');

    socket.on('session:qr', ({ sessionId, qr }) => {
      console.log('QR code received for session:', sessionId, 'QR length:', qr?.length);
      setQrCodes(prev => {
        const newMap = new Map(prev);
        newMap.set(sessionId, qr);
        console.log('QR codes map updated, size:', newMap.size);
        return newMap;
      });
    });

    socket.on('session:ready', ({ sessionId, phoneNumber }) => {
      console.log('Session ready:', sessionId, phoneNumber);
      toast.success(`Session connected: ${phoneNumber}`);
      setQrCodes(prev => {
        const newMap = new Map(prev);
        newMap.delete(sessionId);
        return newMap;
      });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    });

    socket.on('session:disconnected', ({ sessionId }) => {
      console.log('Session disconnected:', sessionId);
      toast.info('Session disconnected');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    });

    socket.on('session:error', ({ sessionId, error }) => {
      console.error('Session error:', sessionId, error);
      toast.error(`Session error: ${error}`);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    });

    return () => {
      socket.off('session:qr');
      socket.off('session:ready');
      socket.off('session:disconnected');
      socket.off('session:error');
    };
  }, [socket, queryClient]);

  // Convert QR codes to images
  useEffect(() => {
    const generateQRImages = async () => {
      const newImages = new Map<string, string>();

      for (const [sessionId, qrData] of qrCodes.entries()) {
        try {
          const dataUrl = await QRCode.toDataURL(qrData, {
            width: 256,
            margin: 2,
          });
          newImages.set(sessionId, dataUrl);
          console.log('Generated QR image for session:', sessionId);
        } catch (error) {
          console.error('Failed to generate QR code image:', error);
        }
      }

      setQrImages(newImages);
    };

    if (qrCodes.size > 0) {
      generateQRImages();
    }
  }, [qrCodes]);

  // Auto-select first connected session
  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      const connectedSession = sessions.find(s => s.status === 'connected');
      if (connectedSession) {
        setSelectedSessionId(connectedSession.id);
        localStorage.setItem('selectedSessionId', connectedSession.id);
      }
    }
  }, [sessions, selectedSessionId]);

  // Load selected session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedSessionId');
    if (saved) {
      setSelectedSessionId(saved);
    }
  }, []);

  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    localStorage.setItem('selectedSessionId', sessionId);
  };

  const handleCreateSession = async () => {
    try {
      const result = await createSessionMutation.mutateAsync();
      toast.success('Session created! Waiting for QR code...');
      setSelectedSessionId(result.sessionId);
      localStorage.setItem('selectedSessionId', result.sessionId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create session');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const qrCode = qrCodes.get(selectedSessionId);
  const qrImage = qrImages.get(selectedSessionId);

  // Debug logging
  useEffect(() => {
    console.log('Selected session ID:', selectedSessionId);
    console.log('QR codes map:', Array.from(qrCodes.entries()));
    console.log('QR code for selected session:', qrCode);
    console.log('QR image for selected session:', qrImage ? 'Generated' : 'Not generated');
  }, [selectedSessionId, qrCodes, qrCode, qrImage]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/send', label: 'Send Message', icon: MessageSquare },
    { href: '/dashboard/messages', label: 'Message Logs', icon: Inbox },
    { href: '/dashboard/auto-replies', label: 'Auto-Replies', icon: Zap },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">WA Manager</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 font-medium' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Session Selector */}
            <div className="flex items-center gap-3">
              <Select value={selectedSessionId} onValueChange={handleSessionChange}>
                <SelectTrigger className="w-[200px] sm:w-[250px]">
                  <SelectValue placeholder="Select session" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No sessions</div>
                  ) : (
                    sessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            session.status === 'connected' ? 'bg-green-500' :
                            session.status === 'connecting' ? 'bg-yellow-500' :
                            session.status === 'qr' ? 'bg-blue-500' : 'bg-gray-500'
                          }`} />
                          <span className="truncate">
                            {session.phoneNumber || session.id.substring(0, 8)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <Button
                onClick={handleCreateSession}
                disabled={createSessionMutation.isPending}
                size="sm"
              >
                {createSessionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span className="hidden sm:inline ml-2">New</span>
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 hidden sm:inline">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-4 lg:p-6">
            {/* QR Code Card */}
            {qrImage && selectedSession && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      {/* QR Code */}
                      <div className="bg-white p-4 rounded-lg shadow-md">
                        <img src={qrImage} alt="QR Code" className="w-48 h-48" />
                      </div>
                      
                      {/* Instructions */}
                      <div className="flex-1 text-white text-center md:text-left">
                        <h2 className="text-2xl font-bold mb-2">Connect Your WhatsApp</h2>
                        <p className="text-blue-100 mb-4">
                          Session: {selectedSession.phoneNumber || selectedSession.id.substring(0, 8)}
                        </p>
                        <div className="space-y-2 text-sm text-blue-50">
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-semibold">1</span>
                            <span>Open WhatsApp on your phone</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-semibold">2</span>
                            <span>Tap Menu or Settings and select Linked Devices</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center font-semibold">3</span>
                            <span>Tap Link a Device and scan this QR code</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
