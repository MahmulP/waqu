'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
}

interface AutoReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editingReply: AutoReply | null;
  sessionId: string;
}

export function AutoReplyDialog({ open, onOpenChange, onSave, editingReply, sessionId }: AutoReplyDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    matchType: 'contains',
    trigger: '',
    reply: '',
    isActive: true,
    caseSensitive: false,
    priority: 'normal',
    useAi: false,
    aiContext: '',
    allowedNumbers: '',
  });

  useEffect(() => {
    if (open) {
      if (editingReply) {
        setFormData({
          name: editingReply.name,
          matchType: editingReply.matchType,
          trigger: editingReply.trigger,
          reply: editingReply.reply,
          isActive: editingReply.isActive,
          caseSensitive: editingReply.caseSensitive,
          priority: editingReply.priority,
          useAi: editingReply.useAi,
          aiContext: editingReply.aiContext || '',
          allowedNumbers: editingReply.allowedNumbers || '',
        });
      } else {
        setFormData({
          name: '',
          matchType: 'contains',
          trigger: '',
          reply: '',
          isActive: true,
          caseSensitive: false,
          priority: 'normal',
          useAi: false,
          aiContext: '',
          allowedNumbers: '',
        });
      }
    }
  }, [open, editingReply]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingReply
        ? `/api/auto-replies/${editingReply.id}`
        : '/api/auto-replies';
      
      const method = editingReply ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sessionId: sessionId,
          aiContext: formData.useAi ? formData.aiContext : null,
        }),
      });

      if (response.ok) {
        toast.success(editingReply ? 'Auto-reply updated' : 'Auto-reply created');
        onSave();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save auto-reply');
      }
    } catch (error) {
      toast.error('Failed to save auto-reply');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingReply ? 'Edit Auto-Reply' : 'Create Auto-Reply'}</DialogTitle>
          <DialogDescription>
            Configure automatic responses to incoming messages
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Welcome Message"
              required
            />
          </div>

          {/* Match Type */}
          <div className="space-y-2">
            <Label htmlFor="matchType">Match Type *</Label>
            <Select
              value={formData.matchType}
              onValueChange={(value) => setFormData({ ...formData, matchType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exact">Exact Match</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="starts_with">Starts With</SelectItem>
                <SelectItem value="ends_with">Ends With</SelectItem>
                <SelectItem value="regex">Regex Pattern</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {formData.matchType === 'exact' && 'Message must match exactly'}
              {formData.matchType === 'contains' && 'Message must contain the trigger text'}
              {formData.matchType === 'starts_with' && 'Message must start with the trigger text'}
              {formData.matchType === 'ends_with' && 'Message must end with the trigger text'}
              {formData.matchType === 'regex' && 'Use regular expression pattern'}
            </p>
          </div>

          {/* Trigger */}
          <div className="space-y-2">
            <Label htmlFor="trigger">Trigger Text/Pattern *</Label>
            <Input
              id="trigger"
              value={formData.trigger}
              onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
              placeholder={formData.matchType === 'regex' ? '^(hi|hello|hey)$' : 'hello'}
              className="font-mono"
              required
            />
          </div>

          {/* Use AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex-1">
              <Label htmlFor="useAi" className="text-base font-semibold">Use AI Reply</Label>
              <p className="text-sm text-gray-600">
                Generate responses using AI based on context
              </p>
            </div>
            <Switch
              id="useAi"
              checked={formData.useAi}
              onCheckedChange={(checked) => setFormData({ ...formData, useAi: checked })}
            />
          </div>

          {/* AI Context or Reply */}
          {formData.useAi ? (
            <div className="space-y-2">
              <Label htmlFor="aiContext">AI Context</Label>
              <Textarea
                id="aiContext"
                value={formData.aiContext}
                onChange={(e) => setFormData({ ...formData, aiContext: e.target.value })}
                placeholder="e.g., You are a customer service assistant. Be helpful and friendly. Answer questions about our products and services."
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Provide context to guide AI responses. AI will reply in Bahasa Indonesia.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="reply">Reply Message *</Label>
              <Textarea
                id="reply"
                value={formData.reply}
                onChange={(e) => setFormData({ ...formData, reply: e.target.value })}
                placeholder="Your automatic reply message"
                rows={4}
                required={!formData.useAi}
              />
              <p className="text-xs text-gray-500">
                Variables: {'{sender_number}'}, {'{message}'}, {'{time}'}, {'{date}'}
              </p>
            </div>
          )}

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High (checked first)</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low (checked last)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Allowed Phone Numbers */}
          <div className="space-y-2">
            <Label htmlFor="allowedNumbers">Allowed Phone Numbers (Optional)</Label>
            <Textarea
              id="allowedNumbers"
              value={formData.allowedNumbers}
              onChange={(e) => setFormData({ ...formData, allowedNumbers: e.target.value })}
              placeholder="6281234567890, 6289876543210"
              rows={2}
            />
            <p className="text-xs text-gray-500">
              Leave empty to reply to all numbers. Separate multiple numbers with commas.
              Format: 6281234567890 (without + or spaces)
            </p>
          </div>

          {/* Case Sensitive */}
          <div className="flex items-center space-x-2">
            <Switch
              id="caseSensitive"
              checked={formData.caseSensitive}
              onCheckedChange={(checked) => setFormData({ ...formData, caseSensitive: checked })}
            />
            <Label htmlFor="caseSensitive">Case sensitive matching</Label>
          </div>

          {/* Active */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingReply ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
