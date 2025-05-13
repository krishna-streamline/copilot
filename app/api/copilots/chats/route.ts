// File: /app/api/copilots/chats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runQuery } from '@/lib/snowflake';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MessageSchema = z.object({
  message: z.string().min(1),
  chat_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
  
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
    const body = await req.json();
    const parse = MessageSchema.safeParse(body);
    if (!parse.success) return NextResponse.json({ error: parse.error }, { status: 400 });
  
    const { message, chat_id } = parse.data;
  
    try {
      //await connectSnowflake();
  
      const userRow = await runQuery<{ USER_ID: string }>(
        `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
        [token]
      );
  
      if (!userRow.length) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      const user_id = userRow[0].USER_ID;
  
      const new_chat_id = chat_id || uuidv4();
      const session_id = uuidv4();
  
      let title = 'Untitled';
      if (!chat_id) {
        
        const titlePrompt = `Create a short title for the following chat message: \n"${message}"`;
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: titlePrompt }],
        });
        title = response.choices[0]?.message?.content?.trim() || title;
  
        await runQuery(
          `INSERT INTO COPILOTS_CHATS (CHAT_ID, TITLE, USER_ID) VALUES (?, ?, ?)`,
          [new_chat_id, title, user_id]
        );
      }
      else{
        const chats = await runQuery(
          `SELECT CHAT_ID, TITLE, CREATED_AT FROM COPILOTS_CHATS WHERE CHAT_ID = ? ORDER BY CREATED_AT DESC`,
          [new_chat_id]
        );
        const chat = chats[0]
        title = chat['TITLE'].replaceAll('"',"")
        
      }
  
      // Language Detection
      const detectPrompt = `Identify the language of this message. Only return language name (like English, Spanish, French):\n"${message}"`;
      const detectResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: detectPrompt }],
      });
      const detectedLanguage = detectResponse.choices[0]?.message?.content?.trim() || 'Unknown';
  
      // Translation if needed
      let translatedMessage = message;
      if (detectedLanguage.toLowerCase() !== 'english') {
        const translatePrompt = `Translate this message into English:\n"${message}"`;
        const translateResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: translatePrompt }],
        });
        translatedMessage = translateResponse.choices[0]?.message?.content?.trim() || message;
      }
      const messageFormat = {
        type: 'text',
        text:message
      }
      const translatedMessageFormat = {
        type: 'text',
        text:translatedMessage
      }
      await runQuery(
        `INSERT INTO COPILOTS_CHAT_MESSAGES (CHAT_ID, MESSAGE, TRANSLATE_TO_ENGLISH, ROLE, ORIGINAL_LANGUAGE, RELATED_QUERIES, ERROR) 
         VALUES (?, ?, ?, ?, ?, NULL, NULL)`,
        [new_chat_id, JSON.stringify(messageFormat), JSON.stringify(translatedMessageFormat), 'user', detectedLanguage]
      );
  
      return NextResponse.json({ chat_id: new_chat_id, session_id, title });
    } catch (error) {
      console.error('Error in POST /copilots/chats:', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
      //disconnectSnowflake();
    }
  }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    //await connectSnowflake();
    const userRow = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );

    if (!userRow.length) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    const user_id = userRow[0].USER_ID;

    const chats = await runQuery(
      `SELECT CHAT_ID, TITLE, CREATED_AT FROM COPILOTS_CHATS WHERE USER_ID = ? ORDER BY CREATED_AT DESC`,
      [user_id]
    );

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error in GET /copilots/chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    //disconnectSnowflake();
  }
}

export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  const schema = z.object({ chat_id: z.string(), title: z.string().min(1) });
  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error }, { status: 400 });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    //await connectSnowflake();
    const userRow = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );

    if (!userRow.length) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    const user_id = userRow[0].USER_ID;

    await runQuery(
      `UPDATE COPILOTS_CHATS SET TITLE = ?, UPDATED_AT = CURRENT_TIMESTAMP() WHERE CHAT_ID = ? AND USER_ID = ?`,
      [parse.data.title, parse.data.chat_id, user_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /copilots/chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    //disconnectSnowflake();
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  const schema = z.object({ chat_id: z.string() });
  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error }, { status: 400 });

  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    //await connectSnowflake();
    const userRow = await runQuery<{ USER_ID: string }>(
      `SELECT USER_ID FROM COPILOT_AUTHENTICATION_TOKENS WHERE TOKEN = ? AND EXPIRES > CURRENT_TIMESTAMP()`,
      [token]
    );

    if (!userRow.length) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    const user_id = userRow[0].USER_ID;

    await runQuery(
      `DELETE FROM COPILOTS_CHATS WHERE CHAT_ID = ? AND USER_ID = ?`,
      [parse.data.chat_id, user_id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /copilots/chats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    //disconnectSnowflake();
  }
}
