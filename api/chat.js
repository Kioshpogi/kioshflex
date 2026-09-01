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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?alt=sse&key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: "You are Kioshflex AI Assistant, a helpful movie streaming assistant. Always reply concisely in English. " + text }
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
