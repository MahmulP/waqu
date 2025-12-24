'use client';

import { useEffect, useState } from 'react';
import { useSessionsQuery } from '@/hooks/use-sessions';
import { useSendMessageMutation } from '@/hooks/use-messages';
import { MessageForm } from '@/components/message-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Send, Users, MessageSquare, Plus, Play, Pause, Square, Trash2, Loader2, Edit, Upload, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { BulkMessageDialog } from '@/components/bulk-message-dialog';
import { BulkMessageDetailDialog } from '@/components/bulk-message-detail-dialog';
import { ContactGroupDialog } from '@/components/contact-group-dialog';
import { ContactDialog } from '@/components/contact-dialog';

interface BulkMessage {
  id: string;
  name: string;
  message: string;
  status: string;
  totalContacts: string;
  sentCount: string;
  failedCount: string;
  delayBetweenMessages: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

interface ContactGroup {
  id: string;
  name: string;
  description: string | null;
}

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  groupId: string | null;
  email: string | null;
  notes: string | null;
}

export default function SendMessagePage() {
  const { data: sessions = [] } = useSessionsQuery();
  const sendMessageMutation = useSendMessageMutation();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('single');
  
  // Bulk messages state
  const [campaigns, setCampaigns] = useState<BulkMessage[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  
  // Contacts state
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  // Dialog states
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Get selected session from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selectedSessionId');
    if (saved) {
      setSelectedSessionId(saved);
    }
  }, []);

  // Fetch data when tab changes
  useEffect(() => {
    if (selectedSessionId) {
      if (activeTab === 'bulk') {
        fetchCampaigns();
      } else if (activeTab === 'contacts') {
        fetchGroups();
        fetchContacts();
      }
    }
  }, [activeTab, selectedSessionId]);

  const fetchCampaigns = async () => {
    if (!selectedSessionId) return;
    setCampaignsLoading(true);
    try {
      const response = await fetch(`/api/bulk-messages?sessionId=${selectedSessionId}`);
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    } finally {
      setCampaignsLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/contact-groups');
      if (response.ok) {
        const data = await response.json();
        setGroups(data.groups || []);
      }
    } catch (error) {
      console.error('Failed to fetch groups:', error);
    }
  };

  const fetchContacts = async () => {
    setContactsLoading(true);
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleControlCampaign = async (campaignId: string, action: string) => {
    try {
      const response = await fetch(`/api/bulk-messages/${campaignId}/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        toast.success(`Campaign ${action}ed successfully`);
        fetchCampaigns();
      } else {
        const data = await response.json();
        toast.error(data.error || `Failed to ${action} campaign`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} campaign`);
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/bulk-messages/${campaignId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Campaign deleted');
        fetchCampaigns();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete campaign');
      }
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Contacts will not be deleted.')) return;

    try {
      const response = await fetch(`/api/contact-groups/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Group deleted');
        fetchGroups();
        fetchContacts();
      } else {
        toast.error('Failed to delete group');
      }
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Contact deleted');
        fetchContacts();
      } else {
        toast.error('Failed to delete contact');
      }
    } catch (error) {
      toast.error('Failed to delete contact');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('Please upload a CSV or Excel file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Successfully imported ${data.imported} contacts`);
        fetchContacts();
        fetchGroups();
      } else {
        toast.error(data.error || 'Failed to import contacts');
      }
    } catch (error) {
      toast.error('Failed to import contacts');
    } finally {
      // Reset file input
      e.target.value = '';
    }
  };

  const handleSendMessage = async (
    sessionId: string,
    recipient: string,
    message: string,
    media?: { data: string; mimetype: string; filename?: string }
  ) => {
    await sendMessageMutation.mutateAsync({
      sessionId,
      recipient,
      message,
      media,
    });
  };

  const connectedSessions = sessions.filter(s => s.status === 'connected');
  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'default',
      processing: 'default',
      paused: 'secondary',
      completed: 'default',
      stopped: 'destructive',
      failed: 'destructive',
    };

    const colors: Record<string, string> = {
      pending: 'bg-blue-500',
      processing: 'bg-green-500',
      paused: 'bg-yellow-500',
      completed: 'bg-green-600',
      stopped: 'bg-red-500',
      failed: 'bg-red-600',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {status}
      </Badge>
    );
  };

  if (!selectedSession || selectedSession.status !== 'connected') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Send Message</h1>
          <p className="text-gray-600 mt-1">Send WhatsApp messages through your connected sessions</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              No Connected Session
            </CardTitle>
            <CardDescription>
              {sessions.length === 0
                ? 'Create a new session using the "New" button in the top bar to start sending messages.'
                : connectedSessions.length === 0
                ? 'Connect a session by scanning the QR code to start sending messages.'
                : 'Select a connected session from the dropdown in the top bar.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Send Message</h1>
        <p className="text-gray-600 mt-1">Send WhatsApp messages through your connected sessions</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="single">
            <Send className="h-4 w-4 mr-2" />
            Single Message
          </TabsTrigger>
          <TabsTrigger value="bulk">
            <MessageSquare className="h-4 w-4 mr-2" />
            Bulk Messages
          </TabsTrigger>
          <TabsTrigger value="contacts">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
        </TabsList>

        {/* Single Message Tab */}
        <TabsContent value="single">
          <MessageForm
            sessions={sessions}
            selectedSessionId={selectedSessionId}
            onSendMessage={handleSendMessage}
            isSending={sendMessageMutation.isPending}
          />
        </TabsContent>

        {/* Bulk Messages Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Create and manage bulk message campaigns
            </p>
            <Button onClick={() => setBulkDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          {campaignsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-gray-500 mb-4">Create your first bulk message campaign</p>
                <Button onClick={() => setBulkDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          {getStatusBadge(campaign.status)}
                        </div>
                        <CardDescription>
                          {campaign.sentCount}/{campaign.totalContacts} sent
                          {campaign.failedCount !== '0' && ` • ${campaign.failedCount} failed`}
                          {' • '}Delay: {campaign.delayBetweenMessages}s
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCampaignId(campaign.id);
                            setDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {campaign.status === 'processing' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleControlCampaign(campaign.id, 'pause')}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleControlCampaign(campaign.id, 'stop')}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {campaign.status === 'paused' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleControlCampaign(campaign.id, 'resume')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleControlCampaign(campaign.id, 'stop')}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {['completed', 'stopped', 'failed'].includes(campaign.status) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">
                      {campaign.message}
                    </div>
                    {campaign.startedAt && (
                      <div className="mt-3 text-xs text-gray-500">
                        Started: {new Date(campaign.startedAt).toLocaleString()}
                        {campaign.completedAt && ` • Completed: ${new Date(campaign.completedAt).toLocaleString()}`}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Manage your contacts and groups
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/contacts-template.csv';
                  link.download = 'contacts-template.csv';
                  link.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <Button variant="outline" onClick={() => {
                document.getElementById('csv-upload')?.click();
              }}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button variant="outline" onClick={() => {
                setEditingGroup(null);
                setGroupDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                New Group
              </Button>
              <Button onClick={() => {
                setEditingContact(null);
                setContactDialogOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                New Contact
              </Button>
            </div>
          </div>

          {contactsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : groups.length === 0 && contacts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
                <p className="text-gray-500 mb-4">Create a group and add contacts to get started</p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/contacts-template.csv';
                      link.download = 'contacts-template.csv';
                      link.click();
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                  <Button variant="outline" onClick={() => {
                    document.getElementById('csv-upload')?.click();
                  }}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV/Excel
                  </Button>
                  <Button onClick={() => {
                    setEditingGroup(null);
                    setGroupDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Ungrouped Contacts */}
              {contacts.filter(c => !c.groupId).length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Ungrouped Contacts</CardTitle>
                        <CardDescription>
                          {contacts.filter(c => !c.groupId).length} contacts without a group
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {contacts.filter(c => !c.groupId).map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="font-medium">{contact.name}</div>
                            <div className="text-sm text-gray-500">{contact.phoneNumber}</div>
                            {contact.email && (
                              <div className="text-xs text-gray-400">{contact.email}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingContact(contact);
                                setContactDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Groups with Contacts */}
              {groups.map((group) => {
                const groupContacts = contacts.filter(c => c.groupId === group.id);
                return (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {group.name}
                            <Badge variant="secondary">{groupContacts.length}</Badge>
                          </CardTitle>
                          {group.description && (
                            <CardDescription>{group.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingGroup(group);
                              setGroupDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {groupContacts.length === 0 ? (
                        <p className="text-gray-500 text-center py-4 text-sm">
                          No contacts in this group yet
                        </p>
                      ) : (
                        <div className="grid gap-2">
                          {groupContacts.map((contact) => (
                            <div key={contact.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                              <div className="flex-1">
                                <div className="font-medium">{contact.name}</div>
                                <div className="text-sm text-gray-500">{contact.phoneNumber}</div>
                                {contact.email && (
                                  <div className="text-xs text-gray-400">{contact.email}</div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setContactDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteContact(contact.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BulkMessageDialog
        open={bulkDialogOpen}
        onOpenChange={setBulkDialogOpen}
        onSave={() => {
          setBulkDialogOpen(false);
          fetchCampaigns();
        }}
        sessionId={selectedSessionId}
        groups={groups}
        contacts={contacts}
      />

      <BulkMessageDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        campaignId={selectedCampaignId}
      />

      <ContactGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onSave={() => {
          setGroupDialogOpen(false);
          fetchGroups();
        }}
        editingGroup={editingGroup}
      />

      <ContactDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        onSave={() => {
          setContactDialogOpen(false);
          fetchContacts();
        }}
        editingContact={editingContact}
        groups={groups}
      />
    </div>
  );
}
