'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Key, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const response = await fetch('/api/settings/ai');
      if (response.ok) {
        const data = await response.json();
        setHasApiKey(data.hasApiKey);
      }
    } catch (error) {
      console.error('Failed to check API key:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiApiKey: apiKey }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key saved successfully! (encrypted)' });
        setHasApiKey(true);
        setApiKey('');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Failed to save API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save API key' });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove your API key? Auto-reply with AI will stop working.')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiApiKey: null }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'API key removed successfully' });
        setHasApiKey(false);
      } else {
        setMessage({ type: 'error', text: 'Failed to remove API key' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove API key' });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 mt-1">Configure your AI and application settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API Key
          </CardTitle>
          <CardDescription>
            Configure your OpenAI API key for AI-powered auto-replies. Your key is encrypted before storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {hasApiKey && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <strong>API Key Configured</strong>
                <br />
                Your OpenAI API key is saved and encrypted. AI auto-replies are enabled.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {hasApiKey ? 'Update API Key' : 'OpenAI API Key'}
              </Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={loading}
                className="font-mono"
              />
              <p className="text-sm text-gray-500">
                Get your API key from{' '}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  OpenAI Dashboard
                </a>
              </p>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !apiKey}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasApiKey ? 'Update Key' : 'Save Key'}
              </Button>

              {hasApiKey && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={loading}
                >
                  Remove Key
                </Button>
              )}
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">🔒 Security Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your API key is encrypted with AES-256 before storage</li>
              <li>• The key is never exposed to the frontend</li>
              <li>• Only decrypted in memory when needed for AI calls</li>
              <li>• Set spending limits in your OpenAI dashboard for extra protection</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-2">💡 How to Use</h4>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Get your API key from OpenAI</li>
              <li>Paste it here and click "Save Key"</li>
              <li>Go to Auto-Replies and enable "Use AI" for any rule</li>
              <li>Define AI context to customize responses</li>
              <li>AI will reply in Bahasa Indonesia by default</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Model Information</CardTitle>
          <CardDescription>AI model used for auto-replies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold">GPT-3.5 Turbo</p>
              <p className="text-sm text-gray-500">Fast and cost-effective</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Cost per 1K tokens</p>
              <p className="font-semibold">~$0.002</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
