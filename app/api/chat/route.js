import { NextResponse } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

// Live models on NVIDIA NIM
const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const FALLBACK_MODEL = "meta/llama-3.2-11b-vision-instruct";

export async function POST(req) {
  try {
    const { messages, temperature = 0.5, max_tokens = 2048 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json({ error: "NVIDIA_API_KEY is not configured in environment variables." }, { status: 500 });
    }

    const payload = {
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are Lotus 0.1 Max, a premier frontier AI model hosted on sovereign NVIDIA compute and available via OpenRouter. You provide sharp, doctoral-level reasoning, clean high-performance code, and precise mathematical solutions."
        },
        ...messages
      ],
      temperature,
      max_tokens
    };

    let response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    // Fallback if primary model is unavailable or rate limited
    if (!response.ok) {
      console.warn(`Primary model ${DEFAULT_MODEL} returned ${response.status}. Trying fallback...`);
      payload.model = FALLBACK_MODEL;
      response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify(payload)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `NVIDIA NIM upstream error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    let output = choice?.message?.content;
    const reasoning = choice?.message?.reasoning_content;

    // If content is null, fallback to reasoning content
    if (!output && reasoning) {
      output = reasoning;
    }

    return NextResponse.json({
      content: output || "No response generated.",
      reasoning: reasoning || null,
      model: "lotus-ai/lotus-0.1-max",
      usage: data.usage || null
    });

  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
