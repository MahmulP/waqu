'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  groupId: string | null;
  email: string | null;
  notes: string | null;
}

interface ContactGroup {
  id: string;
  name: string;
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  editingContact: Contact | null;
  groups: ContactGroup[];
}

export function ContactDialog({ open, onOpenChange, onSave, editingContact, groups }: ContactDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    groupId: 'none',
    email: '',
    notes: '',
  });

  useEffect(() => {
    if (open) {
      if (editingContact) {
        setFormData({
          name: editingContact.name,
          phoneNumber: editingContact.phoneNumber,
          groupId: editingContact.groupId || 'none',
          email: editingContact.email || '',
          notes: editingContact.notes || '',
        });
      } else {
        setFormData({
          name: '',
          phoneNumber: '',
          groupId: 'none',
          email: '',
          notes: '',
        });
      }
    }
  }, [open, editingContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingContact
        ? `/api/contacts/${editingContact.id}`
        : '/api/contacts';
      
      const method = editingContact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          groupId: formData.groupId === 'none' ? null : formData.groupId,
        }),
      });

      if (response.ok) {
        toast.success(editingContact ? 'Contact updated' : 'Contact created');
        onSave();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save contact');
      }
    } catch (error) {
      toast.error('Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          <DialogDescription>
            Add contact information for bulk messaging
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder="6281234567890"
              required
            />
            <p className="text-xs text-gray-500">
              Format: 6281234567890 (without + or spaces)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupId">Group</Label>
            <Select
              value={formData.groupId}
              onValueChange={(value) => setFormData({ ...formData, groupId: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Group</SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this contact"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingContact ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
