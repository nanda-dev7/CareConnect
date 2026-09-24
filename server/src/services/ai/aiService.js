import { AI_CONFIG } from '../../config/ai.js';

/**
 * Pluggable AI Service Client
 * Provides abstraction for calling LLM APIs (Gemini, OpenAI) or falls back to intelligent NLP parsing.
 */
export class AIService {
  static async generateStructuredResponse({ prompt, systemInstruction, schema }) {
    if (!AI_CONFIG.apiKey) {
      return null; // Signals fallback to domain heuristic engine
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), AI_CONFIG.timeoutMs);

    try {
      if (AI_CONFIG.provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${AI_CONFIG.model}:generateContent?key=${AI_CONFIG.apiKey}`;
        const body = {
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${systemInstruction}\n\nUser Input:\n${prompt}\n\nPlease respond strictly in JSON matching schema: ${JSON.stringify(schema)}` }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        if (!res.ok) {
          throw new Error(`AI API returned status ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Empty AI response received');
        return JSON.parse(text);
      }

      if (AI_CONFIG.provider === 'groq' || AI_CONFIG.provider === 'openai') {
        const baseUrl = AI_CONFIG.provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';

        const defaultModel = AI_CONFIG.provider === 'groq'
          ? 'llama-3.3-70b-versatile'
          : 'gpt-4o-mini';

        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.apiKey}`
          },
          body: JSON.stringify({
            model: AI_CONFIG.model || defaultModel,
            messages: [
              { role: 'system', content: `${systemInstruction} Return JSON strictly conforming to schema: ${JSON.stringify(schema)}` },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1
          }),
          signal: controller.signal
        });

        if (!res.ok) {
          throw new Error(`${AI_CONFIG.provider.toUpperCase()} API returned status ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        return JSON.parse(content);
      }

      return null;
    } catch (err) {
      console.warn(`[AIService] External AI call failed (${err.message}). Triggering fallback engine.`);
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
