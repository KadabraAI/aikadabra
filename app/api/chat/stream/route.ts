import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    
    if (!message?.trim()) {
      return new Response('Message is required', { status: 400 });
    }

    const apiKey = process.env.PROVIDER_API_KEY;
    const model = process.env.PROVIDER_MODEL;
    
    if (!apiKey) {
      return new Response('Provider API key not configured', { status: 500 });
    }
     
    if (!model) {
      return new Response('Provider model not configured', { status: 500 });
    }

    const apiUrl = process.env.PROVIDER_API_URL;
    
    if (!apiUrl) {
      return new Response('Provider API URL not configured', { status: 500 });
    }
    
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AIKADABRA',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        stream: true,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Provider API error: ${response.status}`);
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            controller.enqueue(value);
          }
        } catch (error) {
          console.error('Stream reading error:', error);
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}