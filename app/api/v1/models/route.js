import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const modelsData = {
    object: "list",
    data: [
      {
        id: "lotus-ai/lotus-0.1-max",
        object: "model",
        created: 1729584000,
        owned_by: "lotus-ai",
        name: "Lotus 0.1 Max",
        description: "Frontier reasoning model synthesized across sovereign NVIDIA H100/B200 cluster infrastructure. 131k context window, sub-300ms time-to-first-token, zero data retention.",
        context_length: 131072,
        max_completion_tokens: 8192,
        pricing: {
          prompt: "0.00000035",
          completion: "0.00000075"
        },
        architecture: {
          modality: "text->text",
          tokenizer: "llama3",
          instruct_type: "llama3"
        },
        top_provider: {
          context_length: 131072,
          max_completion_tokens: 8192,
          is_moderated: false
        },
        per_request_limits: null
      }
    ]
  };

  return NextResponse.json(modelsData, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600'
    }
  });
}
