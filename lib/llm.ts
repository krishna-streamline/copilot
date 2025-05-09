import { OpenAI } from 'openai';
import { runQuery } from './snowflake';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const llmService = {
  async chat({
    sessionId,
    userId,
    prompt,
    model = 'gpt-4',
    temperature = 0.4,
    max_tokens = 1024
  }: {
    sessionId: string;
    userId?: string;
    prompt: string;
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }): Promise<{ explanation: string; data_query: string }> {
    const start = Date.now();
    let responseText = '';
    let parsedResponse: { explanation: string; data_query: string } = { explanation: '', data_query: '' };
    let status: 'success' | 'failure' = 'success';
    let errorMessage = '';
    let usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    };

    try {
      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      });

      responseText = response.choices?.[0]?.message?.content?.trim() || '';
      usage = response.usage ?? usage;

      try {
        parsedResponse = JSON.parse(responseText);

        // Optional validation
        if (!parsedResponse.explanation || !parsedResponse.data_query) {
          throw new Error('Missing required fields in the LLM response.');
        }
      } catch (jsonErr) {
        throw new Error(`Failed to parse JSON from LLM: ${jsonErr.message}`);
      }
    } catch (err: any) {
      console.error('[LLM ERROR]', err);
      status = 'failure';
      errorMessage = err.message || 'Unknown error';
    }

    const latency = Date.now() - start;

    // Insert log entry into LLM_API_LOGS
    const logQuery = `
      INSERT INTO LLM_API_LOGS (
        SESSION_ID, USER_ID, PROMPT_TEXT, RESPONSE_TEXT,
        MODEL_USED, TEMPERATURE, MAX_TOKENS,
        PROMPT_TOKENS, COMPLETION_TOKENS, TOTAL_TOKENS,
        API_STATUS, ERROR_MESSAGE, LATENCY_MS
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      await runQuery(logQuery, [
        sessionId,
        userId || null,
        prompt,
        responseText,
        model,
        temperature,
        max_tokens,
        usage.prompt_tokens,
        usage.completion_tokens,
        usage.total_tokens,
        status,
        errorMessage,
        latency
      ]);
    } catch (logError) {
      console.warn('[LLM LOGGING ERROR]', logError);
    }

    if (status === 'failure') {
      throw new Error(errorMessage);
    }

    return parsedResponse;
  },

  async generateKeyMetrics(prompt: string, sessionId: string, userId?: string) {
    return await this.chat({ sessionId, userId, prompt, model: 'gpt-4', temperature: 0.4 });
  },

  async generateSQLQuery(schemaPrompt: string, messages: { role: string; content: string }[], sessionId = 'default-session', userId?: string) {
    const combinedPrompt = `
${schemaPrompt}

User Messages:
${messages.map((m, i) => `${i + 1}. ${m.content}`).join('\n')}
`.trim();

    return await this.chat({ sessionId, userId, prompt: combinedPrompt, model: 'gpt-4', temperature: 0.2 });
  }
};
