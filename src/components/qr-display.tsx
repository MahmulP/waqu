'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Session } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface QRCodeDisplayProps {
  sessions: Session[];
  qrCodes: Map<string, string>;
}

export function QRCodeDisplay({ sessions, qrCodes }: QRCodeDisplayProps) {
  const [qrImages, setQrImages] = useState<Map<string, string>>(new Map());

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
        } catch (error) {
          console.error('Failed to generate QR code:', error);
        }
      }

      setQrImages(newImages);
    };

    generateQRImages();
  }, [qrCodes]);

  const qrSessions = sessions.filter((s) => s.status === 'qr');

  if (qrSessions.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {qrSessions.map((session) => {
        const qrImage = qrImages.get(session.id);

        return (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="text-lg">Scan QR Code</CardTitle>
              <CardDescription className="font-mono text-xs">
                Session: {session.id.substring(0, 8)}...
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {qrImage ? (
                <>
                  <img
                    src={qrImage}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 border-2 border-gray-200 rounded"
                  />
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Scan this QR code with WhatsApp on your phone
                  </p>
                </>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
