import { mysqlTable, varchar, timestamp, boolean, text, datetime } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: text('password').notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  premiumActiveDate: datetime('premium_active_date'),
  premiumExpiryDate: datetime('premium_expiry_date'),
  aiApiKey: text('ai_api_key'), // OpenAI API key
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  phoneNumber: varchar('phone_number', { length: 50 }),
  status: varchar('status', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActive: datetime('last_active'),
});

export const messages = mysqlTable('messages', {
  id: varchar('id', { length: 255 }).primaryKey(), // WhatsApp message ID
  sessionId: varchar('session_id', { length: 36 }).references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  from: varchar('from', { length: 100 }).notNull(),
  to: varchar('to', { length: 100 }),
  body: text('body'),
  type: varchar('type', { length: 50 }).notNull().default('chat'), // chat, image, video, audio, document
  hasMedia: boolean('has_media').default(false).notNull(),
  timestamp: datetime('timestamp').notNull(),
  isFromMe: boolean('is_from_me').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const autoReplies = mysqlTable('auto_replies', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 36 }).references(() => sessions.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  matchType: varchar('match_type', { length: 20 }).notNull(), // exact, contains, starts_with, ends_with, regex
  trigger: text('trigger').notNull(), // The text/pattern to match
  reply: text('reply').notNull(), // The reply message
  isActive: boolean('is_active').default(true).notNull(),
  caseSensitive: boolean('case_sensitive').default(false).notNull(),
  priority: varchar('priority', { length: 10 }).default('normal').notNull(), // low, normal, high
  useAi: boolean('use_ai').default(false).notNull(), // Use AI to generate reply
  aiContext: text('ai_context'), // Context/instructions for AI
  allowedNumbers: text('allowed_numbers'), // Comma-separated phone numbers (e.g., "6281234567890,6289876543210")
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const autoReplyLogs = mysqlTable('auto_reply_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  autoReplyId: varchar('auto_reply_id', { length: 36 }).references(() => autoReplies.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 36 }).references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  senderNumber: varchar('sender_number', { length: 50 }).notNull(), // Phone number that triggered the reply
  triggerMessage: text('trigger_message').notNull(), // The message that triggered the auto-reply
  sentReply: text('sent_reply').notNull(), // The reply that was sent
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contactGroups = mysqlTable('contact_groups', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const contacts = mysqlTable('contacts', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  groupId: varchar('group_id', { length: 36 }).references(() => contactGroups.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const bulkMessages = mysqlTable('bulk_messages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  userId: varchar('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  sessionId: varchar('session_id', { length: 36 }).references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
  groupId: varchar('group_id', { length: 36 }).references(() => contactGroups.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  message: text('message').notNull(),
  mediaUrl: text('media_url'), // Optional media attachment
  scheduledAt: datetime('scheduled_at'), // When to send (null = send now)
  delayBetweenMessages: varchar('delay_between_messages', { length: 10 }).default('5').notNull(), // Seconds between each message
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, pending, processing, paused, completed, stopped, failed
  totalContacts: varchar('total_contacts', { length: 10 }).default('0').notNull(),
  sentCount: varchar('sent_count', { length: 10 }).default('0').notNull(),
  failedCount: varchar('failed_count', { length: 10 }).default('0').notNull(),
  startedAt: datetime('started_at'), // When sending actually started
  completedAt: datetime('completed_at'), // When sending finished
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});

export const bulkMessageRecipients = mysqlTable('bulk_message_recipients', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bulkMessageId: varchar('bulk_message_id', { length: 36 }).references(() => bulkMessages.id, { onDelete: 'cascade' }).notNull(),
  contactId: varchar('contact_id', { length: 36 }).references(() => contacts.id, { onDelete: 'cascade' }).notNull(),
  phoneNumber: varchar('phone_number', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, sent, failed
  sentAt: datetime('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type AutoReply = typeof autoReplies.$inferSelect;
export type NewAutoReply = typeof autoReplies.$inferInsert;
export type AutoReplyLog = typeof autoReplyLogs.$inferSelect;
export type NewAutoReplyLog = typeof autoReplyLogs.$inferInsert;
export type ContactGroup = typeof contactGroups.$inferSelect;
export type NewContactGroup = typeof contactGroups.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type BulkMessage = typeof bulkMessages.$inferSelect;
export type NewBulkMessage = typeof bulkMessages.$inferInsert;
export type BulkMessageRecipient = typeof bulkMessageRecipients.$inferSelect;
export type NewBulkMessageRecipient = typeof bulkMessageRecipients.$inferInsert;
