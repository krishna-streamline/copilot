import { NextRequest, NextResponse } from 'next/server';
import { runQuery } from '@/lib/snowflake';
import { llmService } from '@/lib/llm';

import devicesSchema from '@/lib/llm-db-schemas/devices.json';
import deviceInfoSchema from '@/lib/llm-db-schemas/devices_info.json';

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
  const currentStore = searchParams.get('store_id');

  const postData = {}
  //postData.tracking = {}
  postData['CHAT_ID'] = chatId
  postData['ROLE'] = 'assistant'
  postData['RELATED_QUERIES'] = ''
  postData['QUERIES'] = ''
  postData['MESSAGE'] = ''
  postData['TRANSLATE_TO_ENGLISH'] = ''
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
    const userMessages = messagesFromDB//.filter(msg => msg.role === 'user');
    const storeFilterContext = currentStore
  ? `
📌 CONTEXT:
A store is already selected in the app interface: STORE = '${currentStore}'.
Always apply this filter exactly as: STORE = '${currentStore}'.
Ignore any store filters mentioned by the user.`
  : '';

  const compareVersionFunction = `${process.env.SNOWFLAKE_DATABASE}.${process.env.SNOWFLAKE_SCHEMA}.COMPARE_APP_VERSION`;

  const schemaContext = `
  You are a Snowflake SQL expert integrated into an enterprise telemetry reporting system.
  
  🎯 GOAL: Generate a syntactically correct and optimized **Snowflake SELECT query** using the schema and user question, while returning a plain-language explanation for end users.
  
  ⚠️ MANDATORY RULES:
  1. ❌ Never generate INSERT, UPDATE, DELETE, or DDL statements. Only SELECT queries are allowed.
  2. Every query MUST include the following condition:
     ${devicesSchema.latest_snapshot_rule}
  3. For columns of type ARRAY<JSON>, always use:
     \`LATERAL FLATTEN(input => parse_json(d.COLUMN_NAME))\`
     ❌ Never use just \`input => d.COLUMN_NAME\`
  4. For WHERE conditions involving strings:
     - Use case-insensitive matching.
     - For most string comparisons, prefer \`LOWER(column) = LOWER('value')\` or \`ILIKE '%value%'\`
     - ❌ Ignore case logic for columns like OSVERSION, ID
  5. For semantic version comparisons (e.g., OSVERSION, application versions), always use:
     ✅ \`${compareVersionFunction}(column, 'version_value') = TRUE\` to find older versions
     ✅ \`... = FALSE\` to find same or newer versions
     ❌ Do NOT use \`<\`, \`>\`, or direct equality checks on version strings
  6. If no specific fields are requested, use \`SELECT *\`
  7. If the user refers to general terms, map them to internal enum values:
     - "OS outdated" → \`OS_STATUS = 'UNHEALTHY'\`
     - "expired certificates" → \`CERTIFICATE_STATUS = 'UNHEALTHY'\`
     - "offline devices" → \`OFFLINE_STATUS = 'UNHEALTHY'\`
     - "at risk" → 'AT_RISK'
     - "healthy" → 'HEALTHY'
  ${storeFilterContext}
  
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
       LATERAL FLATTEN(input => parse_json(d.CERTIFICATES)) c
  WHERE c.value:status = 'UNHEALTHY'
    AND ${devicesSchema.latest_snapshot_rule};
  
  -- 3. User asks: "Devices at risk due to being offline"
  SELECT * FROM ${devicesSchema.table_name}
  WHERE OFFLINE_STATUS = 'AT_RISK'
    AND ${devicesSchema.latest_snapshot_rule};
  
  -- 4. User asks: "List key apps that are outdated"
  SELECT d.NAME, a.value:name::STRING AS app_name, a.value:version::STRING AS installed_version
  FROM ${devicesSchema.table_name} d,
       LATERAL FLATTEN(input => parse_json(d.APPLICATIONS)) a
  WHERE a.value:IS_KEY_APP = true
    AND a.value:status = 'UNHEALTHY'
    AND ${devicesSchema.latest_snapshot_rule};
  
  -- 5. User asks: "Find devices running OS version below 15.0"
  SELECT * FROM ${devicesSchema.table_name}
  WHERE ${compareVersionFunction}(OSVERSION, '15.0') = TRUE
    AND ${devicesSchema.latest_snapshot_rule};
  
  📦 RESPONSE FORMAT:
  Return **only** a single valid JSON object in the following format. Do not return any markdown code block, no extra text, no numbering, no explanation. The response should be plain JSON only.

    
  {
    "explanation": "A simple, human-friendly summary for end users describing what the results contain.",
    "data_query": "The actual Snowflake SELECT statement."
  }
  `.trim();
  

  

    //postData.tracking.userMessages = userMessages
    // Step 1: Generate base query using LLM
    const llmOutput = await llmService.generateSQLQuery(schemaContext, userMessages);
    //postData.tracking.llmOutput = llmOutput

    const { data_query, explanation } = llmOutput;
    const baseQuery = data_query;
    response.baseQuery = baseQuery;
    postData['QUERIES'] = baseQuery
    // Step 2: Run base query to validate
    const queryResult = await runQuery(baseQuery);
    
    if (queryResult.length) {
      // Step 3: Construct key metrics prompt
      const keyMetricsPrompt = `
You are a helpful SQL assistant.

🎯 Your task:
Given:
- A base SQL SELECT query with WHERE conditions filtering device-level data
- A list of column metadata (name, type, description, and sample values)

🧠 Generate a concise JSON array of 3–5 SQL metric objects that:
- Reuse the same WHERE clause from the base query
- Use aggregate functions like COUNT, AVG, MAX, MIN, and GROUP BY
- Focus on meaningful device insights like battery level, OS health, model distribution, and geographic trends

📦 Each object in the JSON array must include:
- "uuid": a unique UUIDv4
- "query": the full SQL query (no line breaks)
- "explanation": a brief 1-sentence description of what the query analyzes (max 20 words)
- "columns": a list of user-friendly names for frontend display

📏 Constraints:
- Return only a valid JSON array, no markdown, no comments, no extra text
- Keep each query under 200 characters
- Do NOT return more than 5 objects
- Assume latest snapshot filter is required unless already in base query

---

Base Query:
${baseQuery}

Column Metadata:
${JSON.stringify(deviceInfoSchema.aggregate_columns, null, 2)}

✅ JSON Output Format:
[
  {
    "uuid": "uuid-v4",
    "query": "SELECT MODEL, COUNT(*) AS count FROM MAIN_DEVICES WHERE ... GROUP BY MODEL;",
    "explanation": "Shows how many devices exist per model.",
    "columns": ["Model", "Count"]
  }
]
`.trim();


      const rawKeyMetricsResponse = await llmService.generateKeyMetrics(
        keyMetricsPrompt,
        chatId
      );
      
      
      

      // Step 4: Parse and assign
      try {
        const parsed = typeof rawKeyMetricsResponse === 'string'
          ? JSON.parse(rawKeyMetricsResponse)
          : rawKeyMetricsResponse;
        
        response.keyMetricsQueries = Array.isArray(parsed) ? parsed : [];
        const message = {}
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
    else{
      postData['TRANSLATE_TO_ENGLISH'] = postData['MESSAGE'] = {
        "type":"no_data",
        "text":"No Results Found"
      }
    }

    

  } catch (error: any) {
    console.error('[generate-chat] error:', error); // logs error object

    // ✅ log full stack trace to see line number
    if (error instanceof Error && error.stack) {
      console.error('[generate-chat] stack trace:', error.stack);
    }

    postData['ROLE'] = 'assistant';
    postData['ERROR'] = {
      message: error.message || 'Internal Server Error',
      stack: error.stack || '',
    };
    postData.message = {
      type: 'error',
      text: error.message,
    };

    // return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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
