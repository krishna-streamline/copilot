// File: /app/api/copilot/collections/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {  runQuery } from '@/lib/snowflake';
import { randomUUID } from 'crypto';
const CollectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
});

const UpdateSchema = CollectionSchema.extend({
  id: z.number(),
});

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    //await connectSnowflake();
    const user = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );
    if (!user.length) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const collections = await runQuery(
      `SELECT ID, TITLE, DESCRIPTION, CREATED_AT FROM COPILOT_COLLECTIONS WHERE USER_ID = ? ORDER BY CREATED_AT DESC`,
      [user[0].USER_ID]
    );
    return NextResponse.json(collections);
  } catch (err) {
    console.error('GET collections error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    //disconnectSnowflake();
  }
}
const CreateCollectionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  chat_id: z.string(),
  message_id: z.number(),
});
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CreateCollectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { chat_id, message_id, title, description } = parsed.data;

  try {
    // Step 1: Authenticate User
    const user = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );
    if (!user.length) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    const user_id = user[0].USER_ID;

    // Step 2: Fetch message data
    const message = await runQuery<{
      QUERIES: string;
      RELATED_QUERIES: string;
    }>(
      `SELECT QUERIES, RELATED_QUERIES FROM COPILOTS_CHAT_MESSAGES WHERE CHAT_ID = ? AND ID = ?`,
      [chat_id.toString(), message_id]
    );
    console.log("message",message)
    if (!message.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const messageContent = {
      queries: message[0].QUERIES,
      related_queries: message[0].RELATED_QUERIES,
    };
    const collectionId = randomUUID();
    // Step 3: Insert into COPILOT_COLLECTIONS
await runQuery(
  `INSERT INTO COPILOT_COLLECTIONS (ID,USER_ID, TITLE, DESCRIPTION, CHAT_ID, MESSAGE_ID, MESSAGE_CONTENT)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [collectionId,user_id, title, description || null, chat_id, message_id, JSON.stringify(messageContent)]
);



    if (!collectionId) {
      return NextResponse.json({ error: 'Collection insert failed' }, { status: 500 });
    }

    // Step 4: Update COPILOTS_CHAT_MESSAGES to reference collection
    await runQuery(
      `UPDATE COPILOTS_CHAT_MESSAGES SET COLLECTION_ID = ? WHERE ID = ? AND CHAT_ID = ?`,
      [collectionId, message_id, chat_id.toString()]
    );

    return NextResponse.json({ success: true, collection_id: collectionId, title:title });
  } catch (err) {
    console.error('POST /collections error:', JSON.stringify(err));
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


export async function PUT(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    //await connectSnowflake();
    const user = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );
    if (!user.length) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await runQuery(
      `UPDATE COPILOT_COLLECTIONS SET TITLE = ?, DESCRIPTION = ?, UPDATED_AT = CURRENT_TIMESTAMP() WHERE ID = ? AND USER_ID = ?`,
      [parsed.data.title, parsed.data.description || null, parsed.data.id, user[0].USER_ID]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PUT collection error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    //disconnectSnowflake();
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    //await connectSnowflake();
    const user = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );
    if (!user.length) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await runQuery(
      `DELETE FROM COPILOT_COLLECTIONS WHERE ID = ? AND USER_ID = ?`,
      [id, user[0].USER_ID]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE collection error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    //disconnectSnowflake();
  }
}
