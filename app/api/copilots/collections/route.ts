// File: /app/api/copilot/collections/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {  runQuery } from '@/lib/snowflake';

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

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = CollectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    //await connectSnowflake();
    const user = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );
    if (!user.length) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await runQuery(
      `INSERT INTO COPILOT_COLLECTIONS (USER_ID, TITLE, DESCRIPTION) VALUES (?, ?, ?)`,
      [user[0].USER_ID, parsed.data.title, parsed.data.description || null]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST collection error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  } finally {
    //disconnectSnowflake();
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
