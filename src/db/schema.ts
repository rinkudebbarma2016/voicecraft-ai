import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (maps Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Generated and animated videos table (Cloud SQL storage)
export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  prompt: text('prompt'),
  sourceImage: text('source_image'),
  videoUrl: text('video_url').notNull(),
  model: text('model').default('gemini-omni-1.2-flash').notNull(),
  aspectRatio: text('aspect_ratio').default('16:9').notNull(),
  duration: integer('duration').default(5).notNull(),
  resolution: text('resolution').default('720p'),
  metadata: text('metadata'), // JSON stringified configuration
  createdAt: timestamp('created_at').defaultNow(),
});

// Real-time Voice Director conversations table
export const voiceConversations = pgTable('voice_conversations', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  summary: text('summary'),
  transcript: text('transcript').notNull(),
  durationSeconds: integer('duration_seconds').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  voiceConversations: many(voiceConversations),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.uid],
  }),
}));

export const voiceConversationsRelations = relations(voiceConversations, ({ one }) => ({
  user: one(users, {
    fields: [voiceConversations.userId],
    references: [users.uid],
  }),
}));
