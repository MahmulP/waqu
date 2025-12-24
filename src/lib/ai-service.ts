export class AIService {
  /**
   * Generate AI reply using OpenAI API (gpt-3.5-turbo) in Bahasa Indonesia
   */
  static async generateReply(
    apiKey: string,
    context: string,
    userMessage: string
  ): Promise<string> {
    const messages = [
      {
        role: 'system',
        content: context || 'Anda adalah asisten WhatsApp yang membantu. Jawab dalam Bahasa Indonesia dengan natural dan ringkas. Bantu pengguna dengan ramah dan profesional.',
      },
      {
        role: 'user',
        content: userMessage,
      },
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 1000,
          temperature: 0.3, // Lower temperature for more consistent output
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API request failed');
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content;

      if (!reply) {
        throw new Error('No reply generated from AI');
      }

      return reply.trim();
    } catch (error: any) {
      console.error('AI generation error:', error);
      throw new Error(`Failed to generate AI reply: ${error.message}`);
    }
  }

  /**
   * Validate OpenAI API key
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
