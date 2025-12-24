'use client';

import { useState, useRef, useEffect } from 'react';
import { Session } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

interface MessageFormProps {
  sessions: Session[];
  selectedSessionId?: string; // Pre-selected session from parent
  onSendMessage: (sessionId: string, recipient: string, message: string, media?: { data: string; mimetype: string; filename?: string }) => Promise<void>;
  isSending?: boolean;
}

export function MessageForm({ sessions, selectedSessionId, onSendMessage, isSending }: MessageFormProps) {
  const [sessionId, setSessionId] = useState(selectedSessionId || '');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update sessionId when selectedSessionId prop changes
  useEffect(() => {
    if (selectedSessionId) {
      setSessionId(selectedSessionId);
    }
  }, [selectedSessionId]);

  const connectedSessions = sessions.filter((s) => s.status === 'connected');
  const currentSession = sessions.find(s => s.id === sessionId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1MB limit)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 1MB');
      return;
    }

    // Check file type
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

    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file type. Allowed: images, videos, audio, PDF');
      return;
    }

    setMediaFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreview(null);
    }
  };

  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalSessionId = selectedSessionId || sessionId;

    if (!finalSessionId || !recipient) {
      toast.error('Please select a session and enter recipient');
      return;
    }

    if (!message && !mediaFile) {
      toast.error('Please enter a message or attach media');
      return;
    }

    try {
      let mediaData: { data: string; mimetype: string; filename?: string } | undefined;

      if (mediaFile) {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
        });

        reader.readAsDataURL(mediaFile);
        const base64Data = await base64Promise;

        mediaData = {
          data: base64Data,
          mimetype: mediaFile.type,
          filename: mediaFile.name,
        };
      }

      console.log('Calling onSendMessage with:', {
        sessionId: finalSessionId,
        recipient,
        message,
        media: mediaData ? { ...mediaData, data: `${mediaData.data.substring(0, 50)}...` } : undefined
      });

      await onSendMessage(finalSessionId, recipient, message, mediaData);
      toast.success('Message sent successfully!');
      setRecipient('');
      setMessage('');
      handleRemoveMedia();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Message</CardTitle>
        <CardDescription>
          {currentSession 
            ? `Sending from: ${currentSession.phoneNumber || currentSession.id.substring(0, 8)}`
            : 'Send a WhatsApp message through a connected session'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Only show session selector if no session is pre-selected */}
          {!selectedSessionId && (
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select value={sessionId} onValueChange={setSessionId}>
                <SelectTrigger id="session">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {connectedSessions.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No connected sessions</div>
                  ) : (
                    connectedSessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.phoneNumber || session.id.substring(0, 8)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Phone Number</Label>
            <Input
              id="recipient"
              type="text"
              placeholder="6281361626766 or 1234567890@c.us"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isSending}
            />
            <p className="text-xs text-gray-500">
              Format: 6281361626766 or 1234567890@c.us
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Input
              id="message"
              type="text"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media">Media (Optional - Max 1MB)</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="media"
                type="file"
                accept="image/*,video/mp4,video/3gpp,audio/*,application/pdf"
                onChange={handleFileSelect}
                disabled={isSending}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Attach Media
              </Button>
              {mediaFile && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">{mediaFile.name}</span>
                  <span className="text-gray-400">({(mediaFile.size / 1024).toFixed(1)}KB)</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveMedia}
                    disabled={isSending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            {mediaPreview && (
              <div className="mt-2">
                <img src={mediaPreview} alt="Preview" className="max-w-xs rounded border" />
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSending || connectedSessions.length === 0}
            className="w-full"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
