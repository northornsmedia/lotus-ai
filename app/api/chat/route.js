import { NextResponse } from 'next/server';

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";

function sanitizeText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\bNemotron(?:-3|-3\.5)?(?: Ultra| Lightning)?\b/gi, 'Lotus 0.1 Max')
    .replace(/\bresearchers from NVIDIA\b/gi, 'Lotus AI researchers')
    .replace(/\bNVIDIA\b/gi, 'Lotus AI')
    .replace(/^Here's a thinking process:[\s\S]*?(?=\n\n|$)/i, '')
    .replace(/^The user (?:wants|is asking|asks)[\s\S]*?(?:output exactly that string\.|I should[\s\S]*?\.\s*)/i, '')
    .trim();
}

export async function POST(req) {
  try {
    const { messages, temperature = 0.4, max_tokens = 2048 } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json({ error: "Sovereign cluster authentication error." }, { status: 500 });
    }

    const payload = {
      model: PRIMARY_MODEL,
      messages: [
        {
          role: "system",
          content: "You are Lotus 0.1 Max, a premier sovereign frontier AI model developed by Lotus AI. Always identify strictly as Lotus 0.1 Max. Never mention any third-party infrastructure. CRITICAL: Provide direct, doctoral-level, highly accurate answers immediately without internal monologue, planning thoughts, or preambles."
        },
        ...messages
      ],
      temperature,
      max_tokens,
      chat_template_kwargs: { thinking: false },
      thinking: { type: "disabled" }
    };

    let response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn(`Primary model ${PRIMARY_MODEL} returned ${response.status}. Trying fallback...`);
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
      return NextResponse.json({ error: `Upstream error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    let output = choice?.message?.content;
    const reasoning = choice?.message?.reasoning_content;

    if (!output && reasoning) {
      output = sanitizeText(reasoning);
    } else if (output) {
      output = sanitizeText(output);
    }

    return NextResponse.json({
      content: output || "Lotus 0.1 Max is ready.",
      reasoning: null,
      model: "lotus-ai/lotus-0.1-max",
      usage: data.usage || null
    });

  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
