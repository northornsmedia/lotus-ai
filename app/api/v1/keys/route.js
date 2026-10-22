import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    let name = "Developer Free Key";
    try {
      const body = await req.json();
      if (body.name && typeof body.name === 'string') {
        name = body.name.trim().slice(0, 50);
      }
    } catch {
      // Body is optional
    }

    const randomBytes = crypto.randomBytes(24).toString('hex');
    const apiKey = `lotus_live_sk_${randomBytes}`;

    return NextResponse.json({
      key: apiKey,
      name,
      tier: "developer_free",
      status: "active",
      context_window: 3200000,
      limits: {
        requests_per_minute: 10000,
        cost: "0.00 (100% Free Tier)",
        daily_token_quota: "unlimited"
      },
      endpoints: {
        base_url: "https://lotus-max.vercel.app/api/v1",
        chat_completions: "https://lotus-max.vercel.app/api/v1/chat/completions",
        models: "https://lotus-max.vercel.app/api/v1/models"
      },
      created_at: new Date().toISOString()
    }, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error("API Key generation error:", err);
    return NextResponse.json(
      { error: { message: "Failed to generate free developer key.", type: "server_error" } },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return NextResponse.json(
      { error: "Authorization header required to inspect key." },
      { status: 401, headers: corsHeaders }
    );
  }

  return NextResponse.json({
    valid: true,
    key_prefix: token.slice(0, 16) + "...",
    tier: "developer_free",
    status: "active",
    context_window: 3200000,
    rate_limit: "10,000 RPM",
    endpoints: {
      chat_completions: "https://lotus-max.vercel.app/api/v1/chat/completions"
    }
  }, {
    status: 200,
    headers: corsHeaders
  });
}
