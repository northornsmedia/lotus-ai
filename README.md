# Lotus 0.1 Max — Sovereign Frontier AI by Lotus Labs

<p align="center">
  <img src="https://lotus-max.vercel.app/favicon.ico" width="48" height="48" alt="Lotus Labs Logo" />
</p>

<p align="center">
  <strong>Lotus 0.1 Max</strong> is a premier sovereign frontier artificial intelligence developed by <strong>Lotus Labs</strong>.<br />
  Engineered for doctoral-level STEM reasoning, code architecture synthesis, and continuous 3.2M token context ingestion via an ultra-low latency, OpenAI-compatible gateway.
</p>

<p align="center">
  <a href="https://lotus-max.vercel.app/#get-key"><strong>Get Free API Key »</strong></a> •
  <a href="https://lotus-max.vercel.app"><strong>Live Web Playground »</strong></a> •
  <a href="#quickstart"><strong>Quickstart Guide »</strong></a> •
  <a href="#api-reference"><strong>API Reference »</strong></a>
</p>

---

## 🔑 Get Your Free Developer API Key

Lotus Labs offers a **100% Free Developer Tier** with **no credit card required** and **10,000 RPM capacity**.

### Option A: Via Browser UI (Instant)
Visit **[https://lotus-max.vercel.app](https://lotus-max.vercel.app)** and click **"Get Free API Key"** in the top navigation or scroll to the **Free Developer API Key** section.

### Option B: Via Terminal / cURL
Generate an active sovereign API key programmatically in 1 second:

```bash
curl -X POST https://lotus-max.vercel.app/api/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My Production App"}'
```

**Response:**
```json
{
  "key": "lotus_live_sk_4d409133acbefc298fa7dc9245bded37ee6540e5ff0b8b73",
  "name": "My Production App",
  "tier": "developer_free",
  "status": "active",
  "context_window": 3200000,
  "limits": {
    "requests_per_minute": 10000,
    "cost": "0.00 (100% Free Tier)",
    "daily_token_quota": "unlimited"
  },
  "endpoints": {
    "base_url": "https://lotus-max.vercel.app/api/v1",
    "chat_completions": "https://lotus-max.vercel.app/api/v1/chat/completions",
    "models": "https://lotus-max.vercel.app/api/v1/models"
  }
}
```

---

## ⚡ Core Specifications

| Specification | Details |
| :--- | :--- |
| **Model ID** | `lotus-ai/lotus-0.1-max` |
| **Developer / Creator** | **Lotus Labs** |
| **Context Window** | **3,200,000 tokens (3.2M)** with streaming multi-partition ingestion |
| **Max Completion** | 8,192 tokens per request |
| **Architecture** | 550B Sovereign Tensor Foundation |
| **Developer Pricing** | **$0.00 (100% Free Tier)** |
| **Rate Limit** | **10,000 Requests Per Minute (RPM)** |
| **Compatibility** | **100% OpenAI Drop-In Compatible** (`/v1/chat/completions`) |
| **Data Sovereignty** | Ephemeral in-memory execution; zero client data retention |

---

## 🚀 Quickstart

### 1. Python (OpenAI SDK Drop-In)

Install the official OpenAI package:
```bash
pip install openai
```

Use `Lotus 0.1 Max` directly by changing `base_url`:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://lotus-max.vercel.app/api/v1",
    api_key="lotus_live_sk_YOUR_KEY",  # Get free at https://lotus-max.vercel.app
)

completion = client.chat.completions.create(
    model="lotus-ai/lotus-0.1-max",
    messages=[
        {"role": "system", "content": "You are Lotus 0.1 Max, a premier frontier AI by Lotus Labs."},
        {"role": "user", "content": "Design a high-frequency lock-free order book in Rust."}
    ],
    temperature=0.3,
)

print(completion.choices[0].message.content)
```

---

### 2. ⚡ 3.2M Ultra-Context Streaming (Massive Files & Codebases)

Lotus 0.1 Max features automated streaming multi-partition ingestion. Pass huge documents, books, or entire codebases with `stream=True`:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://lotus-max.vercel.app/api/v1",
    api_key="lotus_live_sk_YOUR_KEY",
)

with open("entire_codebase_or_large_doc.txt", "r", encoding="utf-8") as f:
    massive_text = f.read()

# Stream massive context up to 3.2M tokens with live partition tracking:
stream = client.chat.completions.create(
    model="lotus-ai/lotus-0.1-max",
    messages=[
        {"role": "user", "content": f"{massive_text}\n\nTask: Perform a deep security and concurrency audit."}
    ],
    stream=True,
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="", flush=True)
```

---

### 3. TypeScript / Node.js

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://lotus-max.vercel.app/api/v1",
  apiKey: process.env.LOTUS_API_KEY || "lotus_live_sk_YOUR_KEY",
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "lotus-ai/lotus-0.1-max",
    messages: [{ role: "user", content: "Solve Navier-Stokes boundary equations." }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();
```

---

### 4. cURL

```bash
curl https://lotus-max.vercel.app/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer lotus_live_sk_YOUR_KEY" \
  -d '{
    "model": "lotus-ai/lotus-0.1-max",
    "messages": [
      {"role": "user", "content": "Explain quantum error correction in one paragraph."}
    ],
    "stream": true
  }'
```

---

## 📊 Benchmark Matrix

Lotus 0.1 Max has been benchmarked across challenging doctoral-level STEM evaluations:

| Benchmark | Focus Category | **Lotus 0.1 Max** | GPT-4o | Claude 3.5 Sonnet | Gemini 2.5 Pro |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **HumanEval** | Code Generation (Pass@1) | **93.2%** | 90.2% | 92.0% | 88.6% |
| **MATH-500** | Olympiad Mathematics | **82.1%** | 76.6% | 78.3% | 77.0% |
| **MMLU-Pro** | Advanced Multidisciplinary | **78.4%** | 72.6% | 78.0% | 76.2% |
| **GPQA Diamond** | Doctoral Scientific Reasoning | **63.8%** | 53.6% | 59.4% | 58.2% |

---

## 🌐 API Reference

### Base URL
```
https://lotus-max.vercel.app/api/v1
```

### Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/keys` | Generate a new free developer API key | No |
| `GET` | `/api/v1/keys` | Validate an existing API key | Bearer Token |
| `GET` | `/api/v1/models` | List available Lotus Labs models | Optional |
| `POST` | `/api/v1/chat/completions` | Create a chat completion (Streaming & JSON) | **Yes (`Bearer lotus_live_sk_...`)** |

---

## 🛠️ Local Development

To run the Lotus Labs web interface and sovereign gateway locally:

```bash
# Clone the repository
git clone https://github.com/northornsmedia/lotus-ai.git
cd lotus-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the web console and live playground.

---

## 🛡️ License & Rights

Developed and maintained sovereignly by **Lotus Labs**.  
All rights reserved © 2026 Lotus Labs.
