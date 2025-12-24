'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check installation status
    fetch('/api/install/check')
      .then(res => res.json())
      .then(data => {
        if (data.isInstalled) {
          // Check if user is authenticated
          fetch('/api/auth/me')
            .then(res => res.json())
            .then(authData => {
              if (authData.success) {
                router.push('/dashboard');
              } else {
                router.push('/login');
              }
            })
            .catch(() => router.push('/login'));
        } else {
          router.push('/install');
        }
      })
      .catch(() => {
        router.push('/install');
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
