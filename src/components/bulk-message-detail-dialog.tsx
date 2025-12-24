'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Clock, User, Phone, Mail } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

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

interface Recipient {
  id: string;
  phoneNumber: string;
  status: string;
  sentAt: string | null;
  errorMessage: string | null;
  contact: {
    name: string;
    email: string | null;
  } | null;
}

interface BulkMessageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string | null;
}

export function BulkMessageDetailDialog({ open, onOpenChange, campaignId }: BulkMessageDetailDialogProps) {
  const [loading, setLoading] = useState(false);
  const [campaign, setCampaign] = useState<BulkMessage | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');

  useEffect(() => {
    if (open && campaignId) {
      fetchCampaignDetails();
      // Auto-refresh every 5 seconds if campaign is processing
      const interval = setInterval(() => {
        if (campaign?.status === 'processing') {
          fetchCampaignDetails();
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [open, campaignId, campaign?.status]);

  const fetchCampaignDetails = async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      // Fetch campaign details
      const campaignRes = await fetch(`/api/bulk-messages/${campaignId}`);
      if (campaignRes.ok) {
        const campaignData = await campaignRes.json();
        setCampaign(campaignData.campaign);
      }

      // Fetch recipients
      const recipientsRes = await fetch(`/api/bulk-messages/${campaignId}/recipients`);
      if (recipientsRes.ok) {
        const recipientsData = await recipientsRes.json();
        setRecipients(recipientsData.recipients);
      }
    } catch (error) {
      console.error('Error fetching campaign details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!campaign) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const totalContacts = parseInt(campaign.totalContacts);
  const sentCount = parseInt(campaign.sentCount);
  const failedCount = parseInt(campaign.failedCount);
  const pendingCount = totalContacts - sentCount - failedCount;
  const progress = totalContacts > 0 ? (sentCount / totalContacts) * 100 : 0;

  const filteredRecipients = recipients.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      sent: { icon: CheckCircle2, color: 'bg-green-500', label: 'Sent' },
      failed: { icon: XCircle, color: 'bg-red-500', label: 'Failed' },
      pending: { icon: Clock, color: 'bg-yellow-500', label: 'Pending' },
    };

    const { icon: Icon, color, label } = config[status as keyof typeof config] || config.pending;

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    );
  };

  const getCampaignStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      processing: 'bg-green-500',
      paused: 'bg-yellow-500',
      completed: 'bg-green-600',
      stopped: 'bg-red-500',
      failed: 'bg-red-600',
    };

    return (
      <Badge className={colors[status] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {campaign.name}
            {getCampaignStatusBadge(campaign.status)}
          </DialogTitle>
          <DialogDescription>
            Campaign details and recipient delivery status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-medium">{sentCount}/{totalContacts} sent ({progress.toFixed(1)}%)</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{sentCount}</div>
                  <div className="text-xs text-gray-600">Sent</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-xs text-gray-600">Failed</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm">
                <div>
                  <span className="text-gray-600">Delay: </span>
                  <span className="font-medium">{campaign.delayBetweenMessages}s</span>
                </div>
                <div>
                  <span className="text-gray-600">Started: </span>
                  <span className="font-medium">
                    {campaign.startedAt ? new Date(campaign.startedAt).toLocaleString() : 'Not started'}
                  </span>
                </div>
                {campaign.completedAt && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Completed: </span>
                    <span className="font-medium">{new Date(campaign.completedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Message Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded border text-sm whitespace-pre-wrap">
                {campaign.message}
              </div>
            </CardContent>
          </Card>

          {/* Recipients List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recipients ({filteredRecipients.length})</CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-xs rounded ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('sent')}
                    className={`px-3 py-1 text-xs rounded ${filter === 'sent' ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
                  >
                    Sent
                  </button>
                  <button
                    onClick={() => setFilter('failed')}
                    className={`px-3 py-1 text-xs rounded ${filter === 'failed' ? 'bg-red-600 text-white' : 'bg-gray-100'}`}
                  >
                    Failed
                  </button>
                  <button
                    onClick={() => setFilter('pending')}
                    className={`px-3 py-1 text-xs rounded ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-100'}`}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : filteredRecipients.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recipients found</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredRecipients.map((recipient) => (
                    <div
                      key={recipient.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {recipient.contact?.name || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {recipient.phoneNumber}
                          </div>
                          {recipient.contact?.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {recipient.contact.email}
                            </div>
                          )}
                        </div>
                        {recipient.sentAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Sent: {new Date(recipient.sentAt).toLocaleString()}
                          </div>
                        )}
                        {recipient.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {recipient.errorMessage}
                          </div>
                        )}
                      </div>
                      <div>
                        {getStatusBadge(recipient.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
