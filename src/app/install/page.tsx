'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function InstallPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [formData, setFormData] = useState({
    dbHost: 'localhost',
    dbPort: '3306',
    dbUser: 'root',
    dbPassword: '',
    dbName: 'whatsapp_manager',
    adminEmail: '',
    adminName: '',
    adminPassword: '',
  });

  useEffect(() => {
    checkInstallation();
  }, []);

  const checkInstallation = async () => {
    try {
      const response = await fetch('/api/install/check');
      const data = await response.json();
      
      if (data.isInstalled) {
        toast.info('Application already installed');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Check installation error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInstalling(true);

    try {
      const response = await fetch('/api/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Installation failed');
      }

      toast.success('Installation completed successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || 'Installation failed');
    } finally {
      setIsInstalling(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking installation status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Installation Setup</h1>
          <p className="text-gray-600">Configure your database and create admin account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Database Configuration</CardTitle>
            <CardDescription>Enter your MySQL database credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Database Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbHost">Host</Label>
                    <Input
                      id="dbHost"
                      value={formData.dbHost}
                      onChange={(e) => handleChange('dbHost', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dbPort">Port</Label>
                    <Input
                      id="dbPort"
                      value={formData.dbPort}
                      onChange={(e) => handleChange('dbPort', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbUser">Username</Label>
                  <Input
                    id="dbUser"
                    value={formData.dbUser}
                    onChange={(e) => handleChange('dbUser', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbPassword">Password</Label>
                  <Input
                    id="dbPassword"
                    type="password"
                    value={formData.dbPassword}
                    onChange={(e) => handleChange('dbPassword', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dbName">Database Name</Label>
                  <Input
                    id="dbName"
                    value={formData.dbName}
                    onChange={(e) => handleChange('dbName', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">Will be created if it doesn't exist</p>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <h3 className="text-lg font-semibold">Admin Account</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="adminName">Name</Label>
                  <Input
                    id="adminName"
                    value={formData.adminName}
                    onChange={(e) => handleChange('adminName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange('adminEmail', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => handleChange('adminPassword', e.target.value)}
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500">Minimum 8 characters</p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isInstalling}
                className="w-full"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  'Install Application'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
