export function parseLLMResponse<T = any>(responseText: string): T {
  // Try direct JSON parse
  try {
    console.log("parseLLMResponse",responseText)
    return JSON.parse(responseText);
  } catch {
    const matches = [...responseText.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];

    for (const [, block] of matches) {
      try {
        return JSON.parse(block.trim()) as T;
      } catch {
        continue;
      }
    }

    // As a last resort, log for debugging
    console.warn("❌ Could not parse responseText:\n", responseText);
    throw new Error('Failed to parse JSON from LLM: No valid JSON block found.');
  }
}
