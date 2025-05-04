import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runQuery } from '@/lib/snowflake';

// GET /api/copilots/chats/[chat_id]
export async function GET(req: NextRequest, { params }: { params: { chat_id: string } }) {
  const { chat_id } = params;

  try {
    const result = await runQuery(
      `SELECT ID, CHAT_ID, TITLE, USER_ID, CREATED_AT, UPDATED_AT
       FROM COPILOTS_CHATS
       WHERE CHAT_ID = ?`,
      [chat_id]
    );

    if (result.length === 0) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('GET /copilots/chats/[chat_id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/copilots/chats/[chat_id]
export async function PUT(req: NextRequest, { params }: { params: { chat_id: string } }) {
  const { chat_id } = params;
  const schema = z.object({ title: z.string().min(1) });
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    await runQuery(
      `UPDATE COPILOTS_CHATS SET TITLE = ?, UPDATED_AT = CURRENT_TIMESTAMP() WHERE CHAT_ID = ?`,
      [parsed.data.title, chat_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /copilots/chats/[chat_id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/copilots/chats/[chat_id]
export async function DELETE(req: NextRequest, { params }: { params: { chat_id: string } }) {
  const { chat_id } = params;

  try {
    await runQuery(
      `DELETE FROM COPILOTS_CHATS WHERE CHAT_ID = ?`,
      [chat_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /copilots/chats/[chat_id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
