import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/snowflake';

// This is the correct signature for route handlers in App Router
export async function GET(
  req: NextRequest,
  context: { params: { chat_id: string; message_id: string } }
) {
  const { chat_id, message_id } = context.params;

  try {
    const result = await runQuery(
      `SELECT ID, CHAT_ID, MESSAGE, TRANSLATE_TO_ENGLISH, ROLE, ORIGINAL_LANGUAGE, CREATED_AT, UPDATED_AT, ERROR, QUERIES, RELATED_QUERIES
       FROM COPILOTS_CHAT_MESSAGES
       WHERE CHAT_ID = ? AND ID = ?`,
      [chat_id, parseInt(message_id)]
    );

    if (!result.length) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const message = result[0];
    const queryResults: any = {};

    if (message.QUERIES) {
      try {
        queryResults.main_query = await runQuery(message.QUERIES);
      } catch (err) {
        queryResults.main_query_error = `Error in main query: ${err}`;
      }
    }

    if (message.RELATED_QUERIES) {
      try {
        const related = JSON.parse(message.RELATED_QUERIES);
        if (Array.isArray(related)) {
          queryResults.related_queries = [];
          for (const sqlData of related) {
            try {
              const res = await runQuery(sqlData.query);
              queryResults.related_queries.push({
                explanation: sqlData.explanation,
                columns: sqlData.columns,
                result: res
              });
            } catch (err) {
              queryResults.related_queries.push({
                explanation: sqlData.explanation,
                columns: sqlData.columns,
                error: `${err}`
              });
            }
          }
        } else {
          queryResults.related_queries_error = 'RELATED_QUERIES is not a valid array';
        }
      } catch (err) {
        queryResults.related_queries_error = 'RELATED_QUERIES is not valid JSON';
      }
    }

    return NextResponse.json({
      message: {
        ID: message.ID,
        CHAT_ID: message.CHAT_ID,
        MESSAGE: message.MESSAGE,
        TRANSLATE_TO_ENGLISH: message.TRANSLATE_TO_ENGLISH,
        ROLE: message.ROLE,
        ORIGINAL_LANGUAGE: message.ORIGINAL_LANGUAGE,
        CREATED_AT: message.CREATED_AT,
        UPDATED_AT: message.UPDATED_AT,
        ERROR: message.ERROR,
      },
      queries: queryResults,
    });

  } catch (error) {
    console.error('GET /copilots/chats/[chat_id]/messages/[message_id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
