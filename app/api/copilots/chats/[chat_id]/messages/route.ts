// File: /app/api/copilots/chats/[chat_id]/messages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runQuery } from '@/lib/snowflake';

// Schema for message creation or update
const MessageSchema = z.object({
  message: z.string().min(1),
  translate_to_english: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  original_language: z.string().optional(),
  message_id: z.number().optional(), // for PUT or DELETE
});

export async function GET(req: NextRequest, { params }: { params: { chat_id: string } }) {
  const { chat_id } = params;

  try {
    const rows = await runQuery(
      `SELECT ID, MESSAGE, TRANSLATE_TO_ENGLISH, ROLE, ORIGINAL_LANGUAGE, CREATED_AT FROM COPILOTS_CHAT_MESSAGES WHERE CHAT_ID = ? ORDER BY CREATED_AT ASC`,
      [chat_id]
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error('GET /messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { chat_id: string } }) {
  const { chat_id } = params;
  const body = await req.json();
  const parsed = MessageSchema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { message, translate_to_english, role, original_language } = parsed.data;

  try {
    const result = await runQuery(
      `INSERT INTO COPILOTS_CHAT_MESSAGES (CHAT_ID, MESSAGE, TRANSLATE_TO_ENGLISH, ROLE, ORIGINAL_LANGUAGE, RELATED_QUERIES, ERROR)
       VALUES (?, ?, ?, ?, ?, NULL, NULL)`,
      [chat_id, message, translate_to_english || message, role, original_language || 'English']
    );

    return NextResponse.json({ success: true, chat_id });
  } catch (error) {
    console.error('POST /messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { chat_id: string } }) {
  const { chat_id } = params;
  const body = await req.json();
  const parsed = MessageSchema.safeParse(body);

  if (!parsed.success || !parsed.data.message_id) {
    return NextResponse.json({ error: 'Invalid input or missing message_id' }, { status: 400 });
  }

  const { message, translate_to_english, role, original_language, message_id } = parsed.data;

  try {
    await runQuery(
      `UPDATE COPILOTS_CHAT_MESSAGES SET MESSAGE = ?, TRANSLATE_TO_ENGLISH = ?, ROLE = ?, ORIGINAL_LANGUAGE = ?, UPDATED_AT = CURRENT_TIMESTAMP()
       WHERE ID = ? AND CHAT_ID = ?`,
      [message, translate_to_english || message, role, original_language || 'English', message_id, chat_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { chat_id: string } }) {
  const { chat_id } = params;
  const body = await req.json();

  const schema = z.object({ message_id: z.number() });
  const parsed = schema.safeParse(body);

  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    await runQuery(
      `DELETE FROM COPILOTS_CHAT_MESSAGES WHERE ID = ? AND CHAT_ID = ?`,
      [parsed.data.message_id, chat_id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /messages error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
