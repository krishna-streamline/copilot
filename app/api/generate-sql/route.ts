// /app/api/generate-sql/route.ts (Next.js 15+ API Route using app router)
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { runQuery } from '@/lib/snowflake';
import devicesSchema from '@/lib/llm-db-schemas/devices.json'
import deviceInfoSchema from '@/lib/llm-db-schemas/devices.json'
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Fetch chat messages from Snowflake table COPILOTS_CHAT_MESSAGES
async function getMessagesByChatId(chatId: string) {
  const sql = `
    SELECT ROLE, MESSAGE
    FROM COPILOTS_CHAT_MESSAGES
    WHERE CHAT_ID = ? AND ROLE = 'user'
    ORDER BY CREATED_AT ASC
  `;
  const rows = await runQuery<{ ROLE: string; MESSAGE: string }>(sql, [chatId]);
  return rows.map(row => ({ role: row.ROLE.toLowerCase(), content: row.MESSAGE }));
}
async function keyMetrics(baseQuery:string){
  const columns = deviceInfoSchema.aggregate_columns;
  const prompt = `
You are an expert data analyst.

Given the base SQL query:

"${baseQuery}"

And the following aggregated columns with metadata:

${JSON.stringify(columns, null, 2)}

Generate a JSON array of key metric SQL queries based on the base query. Each item must include:
- "query": The SQL query
- "explanation": A brief description of what the query does
- "Columns" : Each Column in query with friendly name for displaying in frontend as json

Focus on grouping, aggregations, health metrics, trends, and breakdowns using relevant fields.

Respond only with the JSON array.
    `.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: "You generate metric-driven SQL queries with brief explanations."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const result = completion.choices[0].message.content;
    return result;

}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chat_id');
  let response = {
    "role":"assistant",
    "keyMetricsQueries":[],
    "summary":""
  }
  if (!chatId) {
    return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
  }

  try {
    const messagesFromDB = await getMessagesByChatId(chatId);
   
    
    const userMessages = messagesFromDB
      .filter((msg: any) => msg.role === 'user')
      .map((msg: any) => ({ role: 'user', content: msg.content }));
    
      
    const schemaContext = `
You are a Snowflake SQL expert. Based on user conversation and the database schema below, generate only a valid SQL query. Do not include any explanations or code blocks without new lines and backlashes for formatting

Table: ${devicesSchema.table_name}
Description: ${devicesSchema.description}
Latest Snapshot Rule: ${devicesSchema.latest_snapshot_rule}

Columns:${devicesSchema.columns.map((col: any) => `- ${col.name} (${col.type}): ${col.description}`).join('\n')}
`;

    const messages = [
      { role: 'system', content: schemaContext },
      ...userMessages
    ];
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0,
      max_tokens: 800
    });
    
    
    console.log(completion);
    let sql = completion.choices[0]?.message?.content;
    sql = sql?.replaceAll('\n',' ')
    const queryResult = await runQuery(sql || '');
    response.baseQuery = sql
    if(queryResult.length){
      const keyMetricsQueries = await keyMetrics(sql)
      response.keyMetricsQueries = keyMetricsQueries?.replaceAll("\n"," ")
    }
    else{

    }
    return NextResponse.json({  result: response });
  } catch (error: any) {
    console.error('[generate-sql] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
