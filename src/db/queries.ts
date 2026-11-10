import { eq, desc } from 'drizzle-orm';
import { db } from './index.ts';
import { users, videos, voiceConversations } from './schema.ts';

// User synchronization & upsert
export async function upsertUser(data: {
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
}) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: data.email,
        displayName: data.displayName || null,
        photoUrl: data.photoUrl || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email,
          displayName: data.displayName || null,
          photoUrl: data.photoUrl || null,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database user upsert failed:', error);
    throw new Error('Failed to synchronize user record', { cause: error });
  }
}

// Video operations
export async function getUserVideos(userId: string) {
  try {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.createdAt));
  } catch (error) {
    console.error('Failed to get user videos:', error);
    throw new Error('Failed to retrieve videos from database', { cause: error });
  }
}

export async function saveUserVideo(data: {
  userId?: string | null;
  title: string;
  prompt?: string;
  sourceImage?: string;
  videoUrl: string;
  model?: string;
  aspectRatio?: string;
  duration?: number;
  resolution?: string;
  metadata?: string;
}) {
  try {
    const result = await db
      .insert(videos)
      .values({
        userId: data.userId || null,
        title: data.title,
        prompt: data.prompt || null,
        sourceImage: data.sourceImage || null,
        videoUrl: data.videoUrl,
        model: data.model || 'gemini-omni-1.2-flash',
        aspectRatio: data.aspectRatio || '16:9',
        duration: data.duration ?? 5,
        resolution: data.resolution || '720p',
        metadata: data.metadata || null,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to save user video:', error);
    throw new Error('Failed to save video to database', { cause: error });
  }
}

export async function deleteUserVideo(id: number, userId: string) {
  try {
    const result = await db
      .delete(videos)
      .where(eq(videos.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to delete video:', error);
    throw new Error('Failed to delete video from database', { cause: error });
  }
}

// Voice conversation operations
export async function saveVoiceConversation(data: {
  userId?: string | null;
  title: string;
  summary?: string;
  transcript: string;
  durationSeconds?: number;
}) {
  try {
    const result = await db
      .insert(voiceConversations)
      .values({
        userId: data.userId || null,
        title: data.title,
        summary: data.summary || null,
        transcript: data.transcript,
        durationSeconds: data.durationSeconds || 0,
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to save voice conversation:', error);
    throw new Error('Failed to save voice conversation to database', { cause: error });
  }
}

export async function getUserVoiceConversations(userId: string) {
  try {
    return await db
      .select()
      .from(voiceConversations)
      .where(eq(voiceConversations.userId, userId))
      .orderBy(desc(voiceConversations.createdAt));
  } catch (error) {
    console.error('Failed to get voice conversations:', error);
    throw new Error('Failed to retrieve voice conversations from database', { cause: error });
  }
}
