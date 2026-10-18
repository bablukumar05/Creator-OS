export class LLMGateway {
  static async complete({ systemPrompt, userPrompt, temperature = 0.2, jsonMode = true }) {
    const apiKey =
      process.env.NEURAL_ENGINE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nTask: ${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature,
              responseMimeType: jsonMode ? 'application/json' : 'text/plain',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return jsonMode ? JSON.parse(text) : text;
          }
        }
      } catch {
      }
    }

    return null;
  }
}
