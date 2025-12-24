'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ContactGroup {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  groupId: string | null;
}

interface BulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  sessionId: string;
  groups: ContactGroup[];
  contacts: Contact[];
}

export function BulkMessageDialog({ open, onOpenChange, onSave, sessionId, groups, contacts }: BulkMessageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    groupId: 'individual',
    selectedContacts: [] as string[],
    delayBetweenMessages: '5',
    scheduledAt: '',
  });

  const [recipientCount, setRecipientCount] = useState(0);

  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        message: '',
        groupId: 'individual',
        selectedContacts: [],
        delayBetweenMessages: '5',
        scheduledAt: '',
      });
    }
  }, [open]);

  useEffect(() => {
    // Calculate recipient count
    if (formData.groupId && formData.groupId !== 'individual') {
      const count = contacts.filter(c => c.groupId === formData.groupId).length;
      setRecipientCount(count);
    } else if (formData.selectedContacts.length > 0) {
      setRecipientCount(formData.selectedContacts.length);
    } else {
      setRecipientCount(0);
    }
  }, [formData.groupId, formData.selectedContacts, contacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientCount === 0) {
      toast.error('Please select a group or contacts');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/bulk-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          name: formData.name,
          message: formData.message,
          groupId: formData.groupId !== 'individual' ? formData.groupId : null,
          contactIds: formData.selectedContacts.length > 0 ? formData.selectedContacts : null,
          delayBetweenMessages: parseInt(formData.delayBetweenMessages),
          scheduledAt: formData.scheduledAt || null,
        }),
      });

      if (response.ok) {
        toast.success('Campaign created and started successfully');
        onSave();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create campaign');
      }
    } catch (error) {
      toast.error('Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const estimatedTime = recipientCount * parseInt(formData.delayBetweenMessages || '5');
  const hours = Math.floor(estimatedTime / 3600);
  const minutes = Math.floor((estimatedTime % 3600) / 60);
  const seconds = estimatedTime % 60;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Bulk Message Campaign</DialogTitle>
          <DialogDescription>
            Campaign will start automatically after creation. Messages will be sent with delay between each.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Monthly Newsletter"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Your message here..."
              rows={6}
              required
            />
            <p className="text-xs text-gray-500">
              Variables: {'{name}'}, {'{phone}'}, {'{email}'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">Select Recipients *</Label>
            <Select
              value={formData.groupId || 'individual'}
              onValueChange={(value) => setFormData({ ...formData, groupId: value === 'individual' ? '' : value, selectedContacts: [] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a group or select individual contacts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual Contacts</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name} ({contacts.filter(c => c.groupId === group.id).length} contacts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(!formData.groupId || formData.groupId === 'individual') && (
            <div className="space-y-2">
              <Label>Select Contacts</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                {contacts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No contacts available</p>
                ) : (
                  contacts.map((contact) => (
                    <label key={contact.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              selectedContacts: [...formData.selectedContacts, contact.id],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              selectedContacts: formData.selectedContacts.filter(id => id !== contact.id),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {contact.name} ({contact.phoneNumber})
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="delayBetweenMessages">Delay Between Messages (seconds) *</Label>
            <Input
              id="delayBetweenMessages"
              type="number"
              min="3"
              max="60"
              value={formData.delayBetweenMessages}
              onChange={(e) => setFormData({ ...formData, delayBetweenMessages: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500">
              Minimum 3 seconds to prevent spam detection. Recommended: 5-10 seconds.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduledAt">Schedule (Optional)</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
            />
            <p className="text-xs text-gray-500">
              Leave empty to send immediately after starting
            </p>
          </div>

          {recipientCount > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Campaign Summary:</strong>
                <br />
                • Recipients: {recipientCount} contacts
                <br />
                • Estimated time: {hours > 0 && `${hours}h `}{minutes > 0 && `${minutes}m `}{seconds}s
                <br />
                • Status: Will be created as draft (click Start to begin sending)
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || recipientCount === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
