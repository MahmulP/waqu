import { AutoReply } from './db/schema';

export interface MatchResult {
  matched: boolean;
  reply?: AutoReply;
}

export class AutoReplyMatcher {
  /**
   * Check if a message matches any auto-reply rules
   */
  static findMatch(message: string, autoReplies: AutoReply[]): MatchResult {
    if (!message || autoReplies.length === 0) {
      return { matched: false };
    }

    // Sort by priority (high > normal > low)
    const sortedReplies = [...autoReplies].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority as keyof typeof priorityOrder] - 
             priorityOrder[a.priority as keyof typeof priorityOrder];
    });

    // Find first matching rule
    for (const reply of sortedReplies) {
      if (!reply.isActive) continue;

      const matched = this.matchMessage(message, reply);
      if (matched) {
        return { matched: true, reply };
      }
    }

    return { matched: false };
  }

  /**
   * Check if a message matches a specific auto-reply rule
   */
  private static matchMessage(message: string, reply: AutoReply): boolean {
    const messageText = reply.caseSensitive ? message : message.toLowerCase();
    const trigger = reply.caseSensitive ? reply.trigger : reply.trigger.toLowerCase();

    switch (reply.matchType) {
      case 'exact':
        return messageText === trigger;

      case 'contains':
        return messageText.includes(trigger);

      case 'starts_with':
        return messageText.startsWith(trigger);

      case 'ends_with':
        return messageText.endsWith(trigger);

      case 'regex':
        try {
          const flags = reply.caseSensitive ? '' : 'i';
          const regex = new RegExp(trigger, flags);
          return regex.test(message);
        } catch (error) {
          console.error('Invalid regex pattern:', trigger, error);
          return false;
        }

      default:
        return false;
    }
  }

  /**
   * Process reply message with variables or AI
   */
  static async processReplyMessage(
    reply: AutoReply,
    variables: {
      senderName?: string;
      senderNumber?: string;
      messageText?: string;
    },
    aiApiKey?: string
  ): Promise<string> {
    // If AI is enabled and API key is configured
    if (reply.useAi && aiApiKey) {
      try {
        const { AIService } = await import('./ai-service');
        
        const context = reply.aiContext || 'Anda adalah asisten WhatsApp yang membantu. Jawab dengan ramah dan profesional dalam Bahasa Indonesia.';
        const userMessage = variables.messageText || '';
        
        const aiReply = await AIService.generateReply(
          aiApiKey,
          context,
          userMessage
        );
        
        return aiReply;
      } catch (error) {
        console.error('AI reply generation failed:', error);
        // Fallback to template reply
      }
    }

    // Use template reply with variables
    let processed = reply.reply;

    // Replace variables
    if (variables.senderName) {
      processed = processed.replace(/\{sender_name\}/g, variables.senderName);
    }
    if (variables.senderNumber) {
      processed = processed.replace(/\{sender_number\}/g, variables.senderNumber);
    }
    if (variables.messageText) {
      processed = processed.replace(/\{message\}/g, variables.messageText);
    }

    // Add timestamp
    const now = new Date();
    processed = processed.replace(/\{time\}/g, now.toLocaleTimeString());
    processed = processed.replace(/\{date\}/g, now.toLocaleDateString());

    return processed;
  }
}
