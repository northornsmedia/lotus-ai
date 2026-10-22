import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const PRIMARY_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const FALLBACK_MODEL = "meta/llama-3.2-11b-vision-instruct";
const PUBLIC_MODEL_NAME = "lotus-ai/lotus-0.1-max";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      messages = [],
      temperature = 0.6,
      top_p = 0.95,
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

    // Build payload for NVIDIA NIM
    const upstreamPayload = {
      model: PRIMARY_MODEL,
      messages,
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

    // Helper to call upstream
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
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const text = decoder.decode(chunk, { stream: true });
          // Ensure model name in chunks shows as Lotus 0.1 Max
          const modified = text
            .replace(new RegExp(PRIMARY_MODEL, 'g'), PUBLIC_MODEL_NAME)
            .replace(new RegExp(FALLBACK_MODEL, 'g'), PUBLIC_MODEL_NAME);
          controller.enqueue(encoder.encode(modified));
        }
      });

      return new Response(upstreamBody.pipeThrough(transformStream), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
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
        if (c.message && !c.message.content && c.message.reasoning_content) {
          c.message.content = c.message.reasoning_content;
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
