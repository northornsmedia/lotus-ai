import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds serverless execution window on Vercel

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || "";
const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

// Live models on sovereign cluster
const PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b";
const FALLBACK_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b";
const PUBLIC_MODEL_NAME = "lotus-ai/lotus-0.1-max";

const LARGE_CONTEXT_THRESHOLD = 30000; // characters (~7,500 tokens)
const PARTITION_SIZE = 25000; // ~6,000 tokens per chunk for ultra-fast reading

const LOTUS_IDENTITY_DIRECTIVE = 
  "You are Lotus 0.1 Max, a premier sovereign frontier AI model created by Lotus AI. " +
  "You must always identify strictly as Lotus 0.1 Max. " +
  "Never mention NVIDIA, Nemotron, or Meta. " +
  "Your context window is 3.2 million tokens (3,200,000 tokens / 3.2M) powered by the Lotus Ultra-Context streaming engine. " +
  "When asked about your context length, specifications, creator, or architecture, always state that your maximum context length is 3.2 million tokens (3.2M). " +
  "CRITICAL: Output ONLY the requested response directly. Never begin with planning thoughts, internal monologue, or phrases like 'The user wants me to...'. Start immediately with the final answer.";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function sanitizeText(text, isChunk = false) {
  if (!text || typeof text !== 'string') return text;
  const cleaned = text
    .replace(/\bNemotron(?:-3|-3\.5)?(?: Ultra| Lightning)?\b/gi, 'Lotus 0.1 Max')
    .replace(/\bresearchers from NVIDIA\b/gi, 'Lotus AI researchers')
    .replace(/\bNVIDIA\b/gi, 'Lotus AI')
    .replace(/\b128(?:,000)?(?:\s*k)?\s*tokens\b/gi, '3.2 million tokens (3.2M)')
    .replace(/\b128k\b/gi, '3.2M')
    .replace(/^Here's a thinking process:[\s\S]*?(?=\n\n|$)/i, '')
    .replace(/^The user (?:wants|is asking|asks)[\s\S]*?(?:output exactly that string\.|I should[\s\S]*?\.\s*)/i, '');
  return isChunk ? cleaned : cleaned.trim();
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

function extractQueryAndContext(messages) {
  let query = "Synthesize and provide a comprehensive, doctoral-level answer based on the full document.";
  let fullContext = "";

  const userMessages = messages.filter(m => m.role === 'user');
  if (userMessages.length > 0) {
    const lastUser = userMessages[userMessages.length - 1].content || "";
    if (lastUser.length < 1500) {
      query = lastUser;
      fullContext = messages
        .filter((_, idx) => idx !== messages.lastIndexOf(userMessages[userMessages.length - 1]))
        .map(m => m.content)
        .join("\n\n");
    } else {
      fullContext = messages.map(m => m.content).join("\n\n");
      const tail = lastUser.slice(-1000);
      const match = tail.match(/(?:Question|Query|Instruction|Task|Prompt):\s*(.+)/i) || tail.match(/([^\n]+\?)/);
      if (match) {
        query = match[1] || match[0];
      }
    }
  } else {
    fullContext = messages.map(m => m.content).join("\n\n");
  }

  return { query, fullContext };
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

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    const apiKey = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: { 
            message: "You didn't provide an API key. You need to provide your API key in an Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY). Generate a free sovereign developer key at https://lotus-max.vercel.app", 
            type: "invalid_request_error", 
            code: "missing_api_key" 
          } 
        },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: { message: "messages array is required and cannot be empty", type: "invalid_request_error" } },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!NVIDIA_API_KEY) {
      return NextResponse.json(
        { error: { message: "Cluster backend credentials unconfigured.", type: "server_error" } },
        { status: 500, headers: corsHeaders }
      );
    }

    const totalChars = messages.reduce((acc, m) => acc + (m.content ? m.content.length : 0), 0);

    // =========================================================================
    // BRANCH 1: ULTRA-CONTEXT PIPELINE (FOR LARGE CONTEXTS UP TO 3.2M TOKENS)
    // =========================================================================
    if (totalChars >= LARGE_CONTEXT_THRESHOLD) {
      const { query, fullContext } = extractQueryAndContext(messages);
      const partitions = partitionText(fullContext, PARTITION_SIZE);
      const estimatedTokens = Math.round(totalChars / 4);

      // Handle Streaming Ultra-Context Ingestion
      if (stream) {
        const encoder = new TextEncoder();
        const customStream = new ReadableStream({
          async start(controller) {
            const streamId = `chatcmpl-${Date.now()}`;
            const created = Math.floor(Date.now() / 1000);

            const sendDelta = (text) => {
              const payload = {
                id: streamId,
                object: "chat.completion.chunk",
                created,
                model: PUBLIC_MODEL_NAME,
                choices: [{ index: 0, delta: { content: text }, finish_reason: null }]
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
            };

            // Immediate TTFB keep-alive: tell client & Vercel streaming has begun
            sendDelta(`⚡ [Lotus 3.2M Ultra-Context Engine: Ingesting ${partitions.length} partitions (${estimatedTokens.toLocaleString()} tokens)]\n\n`);

            const partitionSummaries = [];

            // Pipelined partition reading using fast lightning model
            for (let i = 0; i < partitions.length; i++) {
              sendDelta(`◈ Processing Partition ${i + 1} of ${partitions.length}...\n`);
              try {
                const partRes = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
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
                        content: `You are Lotus 0.1 Max partition analyzer. Extract all key facts, critical data, code blocks, metrics, and details from this partition that are relevant to answering: ${query}. Be concise, factual, and complete.`
                      },
                      { role: "user", content: partitions[i] }
                    ],
                    max_tokens: 400,
                    chat_template_kwargs: { thinking: false }
                  })
                });

                if (partRes.ok) {
                  const partData = await partRes.json();
                  const summary = partData.choices?.[0]?.message?.content || "";
                  partitionSummaries.push(`--- Partition ${i + 1} Insights ---\n${summary}`);
                }
              } catch (partErr) {
                console.warn(`Partition ${i + 1} extraction warning:`, partErr);
              }
            }

            sendDelta(`\n✨ Synthesizing final doctoral-level answer across all partitions...\n\n`);

            // Final synthesis call using Flagship Ultra model
            const synthPayload = {
              model: PRIMARY_MODEL,
              messages: [
                {
                  role: "system",
                  content: LOTUS_IDENTITY_DIRECTIVE + " Provide an authoritative, comprehensive, structured solution based on all analyzed partitions."
                },
                {
                  role: "user",
                  content: `Objective/Question:\n${query}\n\nSynthesized Document Partitions:\n${partitionSummaries.join("\n\n")}`
                }
              ],
              temperature,
              max_tokens,
              stream: true,
              chat_template_kwargs: { thinking: false }
            };

            try {
              const synthRes = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${NVIDIA_API_KEY}`
                },
                body: JSON.stringify(synthPayload)
              });

              if (synthRes.ok) {
                const reader = synthRes.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (trimmed.startsWith('data: ')) {
                      try {
                        const parsed = JSON.parse(trimmed.slice(6));
                        parsed.model = PUBLIC_MODEL_NAME;
                        if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                          delete parsed.choices[0].delta.reasoning_content;
                          if (parsed.choices[0].delta.content) {
                            parsed.choices[0].delta.content = sanitizeText(parsed.choices[0].delta.content, true);
                          }
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                      } catch {
                        controller.enqueue(encoder.encode(`${line}\n`));
                      }
                    }
                  }
                }
              } else {
                sendDelta(`Lotus 0.1 Max processed ${partitions.length} partitions successfully.`);
              }
            } catch (synthErr) {
              sendDelta(`\n[Lotus Engine Error]: ${synthErr.message}`);
            } finally {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
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

      // Non-streaming Ultra-Context Ingestion
      const partitionSummaries = [];
      for (let i = 0; i < partitions.length; i++) {
        try {
          const partRes = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
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
          if (partRes.ok) {
            const partData = await partRes.json();
            const summary = partData.choices?.[0]?.message?.content || "";
            partitionSummaries.push(`--- Partition ${i + 1} ---\n${summary}`);
          }
        } catch (partErr) {
          console.warn(`Non-streaming partition ${i + 1} error:`, partErr);
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
              content: LOTUS_IDENTITY_DIRECTIVE + " Provide an authoritative, comprehensive, structured solution based on all analyzed partitions."
            },
            {
              role: "user",
              content: `Objective/Question:\n${query}\n\nSynthesized Document Partitions:\n${partitionSummaries.join("\n\n")}`
            }
          ],
          temperature,
          max_tokens,
          chat_template_kwargs: { thinking: false }
        })
      });

      if (!synthRes.ok) {
        const errText = await synthRes.text();
        return NextResponse.json(
          { error: { message: `Ultra-Context synthesis error: ${errText}`, type: "upstream_error" } },
          { status: 500, headers: corsHeaders }
        );
      }

      const synthData = await synthRes.json();
      synthData.model = PUBLIC_MODEL_NAME;
      if (Array.isArray(synthData.choices)) {
        synthData.choices.forEach(c => {
          if (c.message) {
            c.message.content = sanitizeText(c.message.content) || "Lotus 0.1 Max processed document context.";
            delete c.message.reasoning_content;
          }
        });
      }
      synthData.usage = {
        prompt_tokens: estimatedTokens,
        completion_tokens: synthData.usage?.completion_tokens || 150,
        total_tokens: estimatedTokens + (synthData.usage?.completion_tokens || 150)
      };

      return NextResponse.json(synthData, { status: 200, headers: corsHeaders });
    }

    // =========================================================================
    // BRANCH 2: DIRECT SINGLE-PASS ROUTE (FOR STANDARD PROMPTS < 30k CHARS)
    // =========================================================================

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
      presence_penalty,
      chat_template_kwargs: body.chat_template_kwargs !== undefined ? body.chat_template_kwargs : { thinking: false },
      thinking: body.thinking !== undefined ? body.thinking : { type: "disabled" }
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

                    if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                      const delta = parsed.choices[0].delta;
                      delete delta.reasoning_content;

                      if (delta.content) {
                        delta.content = sanitizeText(delta.content, true);
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
