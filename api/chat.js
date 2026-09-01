export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const { text } = await req.json();
    const API_KEY = process.env.GEMINI_API_KEY; 

    // Mahigpit na ipinagbabawal ang pagbati sa simula ng mensahe
    const strictPrompt = `[CRITICAL RULE: Never include introductory greetings like "Hello", "Hi", or "I'm your Kioshflex AI Assistant" in your response. Answer the user directly and concisely in English.]\n\nUser: ${text}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: strictPrompt }
            ]
          }
        ]
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(responseText);
    }

    return new Response(responseText, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
