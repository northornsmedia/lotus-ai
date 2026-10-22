import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

// Live models on sovereign cluster
const PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const PUBLIC_MODEL_NAME = "lotus-ai/lotus-0.1-max";

const LOTUS_IDENTITY_DIRECTIVE = 
  "You are Lotus 0.1 Max, a premier sovereign frontier AI model created by Lotus AI. " +
  "You must always identify strictly as Lotus 0.1 Max. " +
  "Never mention NVIDIA, Nemotron, or Meta. " +
  "Provide direct, high-performance answers without meta-commentary, prompt echoes, or thinking preambles.";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\bNemotron(?:-3|-3\.5)?(?: Ultra| Lightning)?\b/gi, 'Lotus 0.1 Max')
    .replace(/\bresearchers from NVIDIA\b/gi, 'Lotus AI researchers')
    .replace(/\bNVIDIA\b/gi, 'Lotus AI')
    .replace(/^Here's a thinking process:[\s\S]*?(?=\n\n|$)/i, '')
    .trim();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages = [],
      temperature = 0.5,
      top_p = 0.9,
      max_tokens = 2048,
      stream = false,
      stop = null,
      frequency_penalty = 0,
      presence_penalty = 0
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: "messages array is required and cannot be empty", type: "invalid_request_error" } },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: { message: "Provider upstream API key not configured.", type: "server_error" } },
        { status: 500, headers: corsHeaders }
      );
    }

    // Ensure Lotus 0.1 Max system persona is ALWAYS present and enforced
    let preparedMessages = [];
    const hasSystem = messages.some(m => m.role === 'system');

    if (hasSystem) {
      preparedMessages = messages.map(m => {
        if (m.role === 'system') {
          return {
            ...m,
            content: `${LOTUS_IDENTITY_DIRECTIVE}\n\nUser Context:\n${m.content}`
          };
        }
        return m;
      });
    } else {
      preparedMessages = [
        { role: 'system', content: LOTUS_IDENTITY_DIRECTIVE },
        ...messages
      ];
    }

    // Build payload for upstream inference
    const upstreamPayload = {
      model: PRIMARY_MODEL,
      messages: preparedMessages,
      temperature,
      top_p,
      max_tokens,
      stream: Boolean(stream),
      frequency_penalty,
      presence_penalty
    };

    if (stop) {
      upstreamPayload.stop = stop;
    }

    async function callUpstream(modelToUse) {
      upstreamPayload.model = modelToUse;
      return await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify(upstreamPayload)
      });
    }

    let upstreamRes = await callUpstream(PRIMARY_MODEL);

    if (!upstreamRes.ok) {
      console.warn(`Upstream primary model ${PRIMARY_MODEL} returned ${upstreamRes.status}. Retrying fallback...`);
      upstreamRes = await callUpstream(FALLBACK_MODEL);
    }

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text();
      return NextResponse.json(
        { error: { message: `Upstream error: ${errText}`, type: "upstream_error", code: upstreamRes.status } },
        { status: upstreamRes.status, headers: corsHeaders }
      );
    }

    // Handle Streaming (SSE)
    if (stream) {
      const upstreamBody = upstreamRes.body;
      const reader = upstreamBody.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const customStream = new ReadableStream({
        async start(controller) {
          let buffer = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) {
                  controller.enqueue(encoder.encode('\n'));
                  continue;
                }

                if (trimmed === 'data: [DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                if (trimmed.startsWith('data: ')) {
                  try {
                    const parsed = JSON.parse(trimmed.slice(6));
                    parsed.model = PUBLIC_MODEL_NAME;

                    // Ensure reasoning delta is never leaked to user stream
                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                      const delta = parsed.choices[0].delta;
                      delete delta.reasoning_content;

                      if (delta.content) {
                        delta.content = sanitizeText(delta.content);
                      }
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                  } catch {
                    controller.enqueue(encoder.encode(`${line}\n`));
                  }
                }
              }
            }
          } catch (streamErr) {
            console.error("Stream reader error:", streamErr);
          } finally {
            controller.close();
          }
        }
      });

      return new Response(customStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no'
        }
      });
    }

    // Handle Non-streaming (JSON)
    const data = await upstreamRes.json();
    data.model = PUBLIC_MODEL_NAME;

    if (Array.isArray(data.choices)) {
      data.choices.forEach(c => {
        if (c.message) {
          let text = c.message.content;
          if (!text && c.message.reasoning_content) {
            text = c.message.reasoning_content;
          }
          c.message.content = sanitizeText(text) || "Lotus 0.1 Max is ready to assist.";
          delete c.message.reasoning_content;
        }
      });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error("Lotus completions error:", err);
    return NextResponse.json(
      { error: { message: err.message || "Internal server error", type: "server_error" } },
      { status: 500, headers: corsHeaders }
    );
  }
}
