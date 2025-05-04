// lib/llm/generateKeyMetricsFromBaseQuery.ts
import { llmService } from './llm';

export async function generateKeyMetricsFromBaseQuery({
  baseQuery,
  aggregationColumns,
  sessionId,
  userId
}: {
  baseQuery: string;
  aggregationColumns: any[];
  sessionId: string;
  userId?: string;
}) {
  const prompt = `
You are a helpful and intelligent SQL assistant.

## Objective
You are given:
- A base SQL query that includes filters in the WHERE clause.
- Metadata for aggregation columns including name, type, description, and sample values.

Your task is to generate **key metric insights** by:
- Reusing the WHERE clause and table from the base query.
- Grouping by meaningful fields (e.g., COUNTRYID, CITY, OSVERSION, MODEL, TYPE).
- Applying relevant aggregate functions (COUNT, AVG, MAX, MIN, SUM).
- Avoid repeating the same column combinations.

## Input

### Base Query:
\`\`\`sql
${baseQuery}
\`\`\`

### Aggregation Columns:
\`\`\`json
${JSON.stringify(aggregationColumns, null, 2)}
\`\`\`

## Output Format
Respond with a valid JSON array of 5 to 10 objects. Each object must include:
- "query": Full SQL query
- "explanation": What the query analyzes
- "columns": Display names for result columns (e.g., ["City", "Device Count"])

Only return a clean **JSON array**. No markdown, no notes, no headings.
`.trim();

  const result = await llmService.generateKeyMetrics(prompt, sessionId, userId);

  try {
    return JSON.parse(result);
  } catch (err) {
    console.error('[KeyMetrics JSON Parse Error]', result);
    throw new Error('Failed to parse LLM response as JSON.');
  }
}
