import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

const PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const PUBLIC_MODEL_NAME = "lotus-ai/lotus-0.1-max";

const LARGE_CONTEXT_THRESHOLD = 30000;
const PARTITION_SIZE = 25000;

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

function partitionText(text, targetSize = PARTITION_SIZE) {
  const parts = [];
  let current = 0;
  while (current < text.length) {
    if (text.length - current <= targetSize) {
      parts.push(text.slice(current));
      break;
    }
    let end = current + targetSize;
    let breakIdx = text.lastIndexOf('\n\n', end);
    if (breakIdx <= current + targetSize * 0.7) {
      breakIdx = text.lastIndexOf('\n', end);
    }
    if (breakIdx <= current + targetSize * 0.7) {
      breakIdx = text.lastIndexOf('. ', end);
    }
    if (breakIdx <= current + targetSize * 0.7) {
      breakIdx = end;
    } else {
      breakIdx += 1;
    }
    parts.push(text.slice(current, breakIdx).trim());
    current = breakIdx;
  }
  return parts.filter(p => p.length > 0);
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

    const totalChars = messages.reduce((acc, m) => acc + (m.content ? m.content.length : 0), 0);

    // Ultra-Context Partitioning if large text is entered
    if (totalChars >= LARGE_CONTEXT_THRESHOLD) {
      const lastUser = messages.filter(m => m.role === 'user').pop()?.content || "";
      const query = lastUser.length < 1500 ? lastUser : "Synthesize and analyze all key information from this document.";
      const fullContext = messages.map(m => m.content).join("\n\n");
      const partitions = partitionText(fullContext, PARTITION_SIZE);

      const summaries = [];
      for (let i = 0; i < partitions.length; i++) {
        try {
          const res = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${NVIDIA_API_KEY}`
            },
            body: JSON.stringify({
              model: FALLBACK_MODEL,
              messages: [
                {
                  role: "system",
                  content: `Extract key facts, critical data, code blocks, and metrics from this partition relevant to: ${query}`
                },
                { role: "user", content: partitions[i] }
              ],
              max_tokens: 350,
              chat_template_kwargs: { thinking: false }
            })
          });
          if (res.ok) {
            const data = await res.json();
            summaries.push(`--- Partition ${i + 1} Insights ---\n${data.choices?.[0]?.message?.content || ""}`);
          }
        } catch (err) {
          console.warn(`Chat partition ${i + 1} error:`, err);
        }
      }

      const synthRes = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${NVIDIA_API_KEY}`
        },
        body: JSON.stringify({
          model: PRIMARY_MODEL,
          messages: [
            {
              role: "system",
              content: "You are Lotus 0.1 Max, a premier sovereign frontier AI model developed by Lotus AI. Always identify strictly as Lotus 0.1 Max. Never mention any third-party infrastructure. CRITICAL: Provide direct, doctoral-level, highly accurate answers based on all analyzed partitions without internal monologue or preambles."
            },
            {
              role: "user",
              content: `Objective/Question:\n${query}\n\nAnalyzed Document Partitions (${partitions.length} partitions, ~${Math.round(totalChars/4).toLocaleString()} tokens ingested):\n${summaries.join("\n\n")}`
            }
          ],
          temperature,
          max_tokens,
          chat_template_kwargs: { thinking: false }
        })
      });

      if (!synthRes.ok) {
        const errorText = await synthRes.text();
        return NextResponse.json({ error: `Synthesis error: ${errorText}` }, { status: synthRes.status });
      }

      const synthData = await synthRes.json();
      const rawText = synthData.choices?.[0]?.message?.content || "";
      return NextResponse.json({
        content: sanitizeText(rawText) || "Lotus 0.1 Max synthesized document analysis.",
        reasoning: null,
        model: PUBLIC_MODEL_NAME,
        usage: {
          prompt_tokens: Math.round(totalChars / 4),
          completion_tokens: synthData.usage?.completion_tokens || 200,
          total_tokens: Math.round(totalChars / 4) + (synthData.usage?.completion_tokens || 200)
        }
      });
    }

    // Direct Single-Pass execution for standard queries
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
      model: PUBLIC_MODEL_NAME,
      usage: data.usage || null
    });

  } catch (err) {
    console.error("API Route Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
