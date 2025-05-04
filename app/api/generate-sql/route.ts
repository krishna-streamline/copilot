import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/snowflake';
import { llmService } from '@/lib/llm';

import devicesSchema from '@/lib/llm-db-schemas/devices.json';
import deviceInfoSchema from '@/lib/llm-db-schemas/devices.json';

// Fetch user messages for a chat session
async function getMessagesByChatId(chatId: string) {
  const sql = `
    SELECT ROLE, MESSAGE
    FROM COPILOTS_CHAT_MESSAGES
    WHERE CHAT_ID = ?
    ORDER BY CREATED_AT ASC
  `;
  const rows = await runQuery<{ ROLE: string; MESSAGE: string }>(sql, [chatId]);
  return rows.map(row => ({ role: row.ROLE.toLowerCase(), content: row.MESSAGE }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chat_id');
  const postData = {}
  postData['CHAT_ID'] = chatId
  postData['ROLE'] = 'assistant'
  postData['RELATED_QUERIES'] = ''
  postData['QUERIES'] = ''
  const response: {
    role: string;
    baseQuery?: string;
    keyMetricsQueries: any[];
    summary: string;
  } = {
    role: 'assistant',
    keyMetricsQueries: [],
    summary: ''
  };

  if (!chatId) {
    return NextResponse.json({ error: 'chat_id is required' }, { status: 400 });
  }

  try {
    const messagesFromDB = await getMessagesByChatId(chatId);
    const userMessages = messagesFromDB.filter(msg => msg.role === 'user');

    const schemaContext = `
You are a Snowflake SQL expert.

🎯 GOAL: Generate a syntactically correct **Snowflake SELECT query** using the table schema and user question.

⚠️ MANDATORY RULES:
1. Only generate SELECT queries. ❌ Never use INSERT, UPDATE, DELETE, or DDL statements.
2. Every query MUST include this condition in the WHERE clause:
   ${devicesSchema.latest_snapshot_rule}
3. For columns of type ARRAY<JSON>, use LATERAL FLATTEN to access nested fields.
4. Do NOT explain the query. Do NOT use markdown formatting.
5. If the user does not ask for specific columns, default to: SELECT *.
6. If the user refers to concepts like "OS outdated", "expired certificate", or "offline", map them as:
   - OS_STATUS = 'UNHEALTHY'
   - APPLICATION_STATUS = 'UNHEALTHY'
   - CERTIFICATE_STATUS = 'UNHEALTHY'
   - OFFLINE_STATUS = 'UNHEALTHY'
   - "at risk" → 'AT_RISK'
   - "healthy" → 'HEALTHY'

📄 TABLE: ${devicesSchema.table_name}
📝 DESCRIPTION: ${devicesSchema.description}

📊 SCHEMA COLUMNS:
${devicesSchema.columns.map(col => `- ${col.name} (${col.type}): ${col.description}`).join('\n')}

🔁 ENUM COLUMNS:
${devicesSchema.columns
  .filter(col => col.enum_values)
  .map(col => `- ${col.name}: ${col.enum_values?.join(', ')}`)
  .join('\n')}

💡 EXAMPLES (for fine-tuning):

-- 1. User asks: "List devices where OS is outdated"
SELECT * FROM ${devicesSchema.table_name}
WHERE OS_STATUS = 'UNHEALTHY'
  AND ${devicesSchema.latest_snapshot_rule};

-- 2. User asks: "Show expired certificates"
SELECT d.NAME, c.value:commonName::STRING AS common_name, c.value:expirationDate::TIMESTAMP AS expiry_date
FROM ${devicesSchema.table_name} d,
     LATERAL FLATTEN(input => d.CERTIFICATES) c
WHERE c.value:status = 'UNHEALTHY'
  AND ${devicesSchema.latest_snapshot_rule};

-- 3. User asks: "Devices at risk due to being offline"
SELECT * FROM ${devicesSchema.table_name}
WHERE OFFLINE_STATUS = 'AT_RISK'
  AND ${devicesSchema.latest_snapshot_rule};

-- 4. User asks: "List key apps that are outdated"
SELECT d.NAME, a.value:name::STRING AS app_name, a.value:version::STRING AS installed_version
FROM ${devicesSchema.table_name} d,
     LATERAL FLATTEN(input => d.APPLICATIONS) a
WHERE a.value:IS_KEY_APP = true
  AND a.value:status = 'UNHEALTHY'
  AND ${devicesSchema.latest_snapshot_rule};
  `.trim();



    // Step 1: Generate base query using LLM
    const baseQuery = await llmService.generateSQLQuery(schemaContext, userMessages);
    response.baseQuery = baseQuery;

    // Step 2: Run base query to validate
    const queryResult = await runQuery(baseQuery);

    if (queryResult.length) {
      // Step 3: Construct key metrics prompt
      const keyMetricsPrompt = `
You are a helpful SQL assistant.

Given:
- A base SQL query that filters device-level data using WHERE conditions.
- A list of column metadata (column name, type, description, and sample values).

Your task:
Generate a JSON array of key metric SQL queries that:
- Use the same WHERE clause from the base query
- Apply aggregate functions like COUNT, AVG, MAX, MIN, GROUP BY
- Summarize device behavior, battery levels, outdated OS, etc.

Each JSON object must include:
- "query": Full SQL query
- "explanation": What the query analyzes
- "columns": Friendly names of the selected fields for frontend display

Return 5–10 metric queries.

---

Base Query:
${baseQuery}

Column Metadata:
${JSON.stringify(deviceInfoSchema.aggregate_columns, null, 2)}

Expected Output Example:
[
  {
    "query": "SELECT OSVERSION, COUNT(*) AS device_count FROM MAIN_DEVICES WHERE OS_STATUS = 'UNHEALTHY' AND SNAPSHOT_TIME = (SELECT MAX(SNAPSHOT_TIME) FROM MAIN_DEVICES) GROUP BY OSVERSION;",
    "explanation": "Shows count of outdated devices per OS version.",
    "columns": ["OS Version", "Device Count"]
  },
  {
    "query": "SELECT MODEL, AVG(BATTERYLEVEL) AS avg_battery FROM MAIN_DEVICES WHERE OS_STATUS = 'UNHEALTHY' AND SNAPSHOT_TIME = (SELECT MAX(SNAPSHOT_TIME) FROM MAIN_DEVICES) GROUP BY MODEL;",
    "explanation": "Displays average battery level grouped by device model.",
    "columns": ["Device Model", "Average Battery Level"]
  }
]

Respond with only the JSON array.
`.trim();

      const rawKeyMetricsResponse = await llmService.generateKeyMetrics(keyMetricsPrompt);

      //console.log("📤 Prompt to LLM:\n", keyMetricsPrompt);
      //console.log("📥 Raw LLM Response:\n", rawKeyMetricsResponse);

      // Step 4: Parse and assign
      try {
        const parsed = typeof rawKeyMetricsResponse === 'string'
          ? JSON.parse(rawKeyMetricsResponse)
          : rawKeyMetricsResponse;
        
        response.keyMetricsQueries = Array.isArray(parsed) ? parsed : [];
        let message = {}
        postData['QUERIES'] = baseQuery
        postData['RELATED_QUERIES'] = JSON.stringify(response.keyMetricsQueries);
        if(!queryResult.length){
          message.type="no_data"
          message.text="No Results Found"
          
        }
        else{
          message.type= response.keyMetricsQueries.length ? 'Expand_View' : 'Table_View'
          message.text= `${queryResult.length} reocrds Found AND ${response.keyMetricsQueries.length} Key Metrics Found`
        }
        postData['MESSAGE'] = JSON.stringify(message)
        postData['TRANSLATE_TO_ENGLISH'] = JSON.stringify(message)

      } catch (err) {
        console.warn("❗ Failed to parse keyMetrics response", err);
        response.keyMetricsQueries = [];
      }
    }

    

  } catch (error: any) {
    console.error('[generate-sql] error:', error);
    postData['ROLE'] = 'assistant'
    postData['ERROR'] = { error: error.message || 'Internal Server Error' }
    postData.message = {
      type:'error',
      text:error.message
    }
    //return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
  
  await runQuery(
    `INSERT INTO COPILOTS_CHAT_MESSAGES 
     (CHAT_ID, MESSAGE, TRANSLATE_TO_ENGLISH, ROLE, ORIGINAL_LANGUAGE, QUERIES, RELATED_QUERIES, ERROR) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
     [
      chatId,
      JSON.stringify(postData['MESSAGE']),
      JSON.stringify(postData['MESSAGE']),
      'assistant',
      'English',
      postData['QUERIES'],
      postData['RELATED_QUERIES'],
      '' // If no error
    ]
  );
  
  return NextResponse.json(postData );
}
