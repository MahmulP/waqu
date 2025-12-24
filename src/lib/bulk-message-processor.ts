import { getDbConnection } from './db';
import { bulkMessages, bulkMessageRecipients, contacts } from './db/schema';
import { eq, and } from 'drizzle-orm';

export class BulkMessageProcessor {
  private static processingCampaigns: Set<string> = new Set();
  private static shouldStop: Map<string, boolean> = new Map();

  /**
   * Process all pending bulk messages
   * Called by cron job every minute
   */
  static async processAll() {
    try {
      const { db } = await getDbConnection();

      // Find campaigns that should be processing
      const campaigns = await db
        .select()
        .from(bulkMessages)
        .where(eq(bulkMessages.status, 'processing'));

      console.log(`Found ${campaigns.length} campaigns to process`);

      for (const campaign of campaigns) {
        // Skip if already processing
        if (this.processingCampaigns.has(campaign.id)) {
          console.log(`Campaign ${campaign.id} already being processed, skipping`);
          continue;
        }

        // Process campaign in background
        this.processCampaign(campaign.id).catch((error) => {
          console.error(`Error processing campaign ${campaign.id}:`, error);
        });
      }
    } catch (error) {
      console.error('Error in processAll:', error);
    }
  }

  /**
   * Process a single campaign
   */
  static async processCampaign(campaignId: string) {
    // Mark as processing
    this.processingCampaigns.add(campaignId);
    this.shouldStop.set(campaignId, false);

    try {
      const { db } = await getDbConnection();

      // Get campaign details
      const [campaign] = await db
        .select()
        .from(bulkMessages)
        .where(eq(bulkMessages.id, campaignId))
        .limit(1);

      if (!campaign) {
        console.log(`Campaign ${campaignId} not found`);
        return;
      }

      // Check if campaign is still in processing status
      if (campaign.status !== 'processing') {
        console.log(`Campaign ${campaignId} status changed to ${campaign.status}, stopping`);
        return;
      }

      console.log(`Processing campaign: ${campaign.name} (${campaignId})`);

      // Get pending recipients
      const recipients = await db
        .select({
          id: bulkMessageRecipients.id,
          contactId: bulkMessageRecipients.contactId,
          phoneNumber: bulkMessageRecipients.phoneNumber,
          contact: contacts,
        })
        .from(bulkMessageRecipients)
        .leftJoin(contacts, eq(bulkMessageRecipients.contactId, contacts.id))
        .where(
          and(
            eq(bulkMessageRecipients.bulkMessageId, campaignId),
            eq(bulkMessageRecipients.status, 'pending')
          )
        );

      console.log(`Found ${recipients.length} pending recipients`);

      if (recipients.length === 0) {
        // All done, mark as completed
        await db
          .update(bulkMessages)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(bulkMessages.id, campaignId));

        console.log(`Campaign ${campaignId} completed`);
        return;
      }

      // Process each recipient
      for (const recipient of recipients) {
        // Check if we should stop
        if (this.shouldStop.get(campaignId)) {
          console.log(`Campaign ${campaignId} stopped by user`);
          break;
        }

        // Check campaign status again (might have been paused)
        const [currentCampaign] = await db
          .select()
          .from(bulkMessages)
          .where(eq(bulkMessages.id, campaignId))
          .limit(1);

        if (!currentCampaign || currentCampaign.status !== 'processing') {
          console.log(`Campaign ${campaignId} paused or stopped`);
          break;
        }

        // Send message to recipient
        await this.sendToRecipient(campaignId, recipient, campaign);

        // Wait for delay before next message
        const delayMs = parseInt(campaign.delayBetweenMessages) * 1000;
        console.log(`Waiting ${campaign.delayBetweenMessages}s before next message...`);
        await this.sleep(delayMs);
      }

      // Check if all recipients are done
      const remainingRecipients = await db
        .select()
        .from(bulkMessageRecipients)
        .where(
          and(
            eq(bulkMessageRecipients.bulkMessageId, campaignId),
            eq(bulkMessageRecipients.status, 'pending')
          )
        );

      if (remainingRecipients.length === 0) {
        // Mark as completed
        await db
          .update(bulkMessages)
          .set({
            status: 'completed',
            completedAt: new Date(),
          })
          .where(eq(bulkMessages.id, campaignId));

        console.log(`Campaign ${campaignId} completed`);
      }
    } catch (error) {
      console.error(`Error processing campaign ${campaignId}:`, error);

      // Mark campaign as failed
      try {
        const { db } = await getDbConnection();
        await db
          .update(bulkMessages)
          .set({ status: 'failed' })
          .where(eq(bulkMessages.id, campaignId));
      } catch (updateError) {
        console.error('Failed to update campaign status:', updateError);
      }
    } finally {
      // Clean up
      this.processingCampaigns.delete(campaignId);
      this.shouldStop.delete(campaignId);
    }
  }

  /**
   * Send message to a single recipient
   */
  private static async sendToRecipient(
    campaignId: string,
    recipient: any,
    campaign: any
  ) {
    const { db } = await getDbConnection();

    try {
      console.log(`Sending to ${recipient.phoneNumber}...`);

      // Replace variables in message
      let message = campaign.message;
      if (recipient.contact) {
        message = message.replace(/{name}/g, recipient.contact.name || '');
        message = message.replace(/{phone}/g, recipient.contact.phoneNumber || '');
        message = message.replace(/{email}/g, recipient.contact.email || '');
      }

      // Send via WhatsApp API
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: campaign.sessionId,
          recipient: recipient.phoneNumber,
          message: message,
        }),
      });

      if (response.ok) {
        // Mark as sent
        await db
          .update(bulkMessageRecipients)
          .set({
            status: 'sent',
            sentAt: new Date(),
          })
          .where(eq(bulkMessageRecipients.id, recipient.id));

        // Update campaign sent count
        await db
          .update(bulkMessages)
          .set({
            sentCount: (parseInt(campaign.sentCount) + 1).toString(),
          })
          .where(eq(bulkMessages.id, campaignId));

        console.log(`✓ Sent to ${recipient.phoneNumber}`);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error: any) {
      console.error(`✗ Failed to send to ${recipient.phoneNumber}:`, error.message);

      // Mark as failed
      await db
        .update(bulkMessageRecipients)
        .set({
          status: 'failed',
          errorMessage: error.message,
        })
        .where(eq(bulkMessageRecipients.id, recipient.id));

      // Update campaign failed count
      await db
        .update(bulkMessages)
        .set({
          failedCount: (parseInt(campaign.failedCount) + 1).toString(),
        })
        .where(eq(bulkMessages.id, campaignId));
    }
  }

  /**
   * Stop processing a campaign
   */
  static stopCampaign(campaignId: string) {
    this.shouldStop.set(campaignId, true);
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
