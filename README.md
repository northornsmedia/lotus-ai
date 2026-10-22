# Lotus 0.1 Max (Global Sovereign Frontier Architecture)

Lotus 0.1 Max is a premier global frontier artificial intelligence developed by **Lotus AI**. Engineered for high-throughput doctoral-level reasoning, code synthesis, and mathematical proofs via an OpenAI-compatible provider gateway.

---

## 🌐 Model Identity: Lotus 0.1 Max

- **Model ID**: `lotus-ai/lotus-0.1-max`
- **Context Length**: 3,200,000 tokens (3.2M)
- **Max Completion**: 8,192 tokens
- **Inference Infrastructure**: Dedicated Sovereign Neural Cluster
- **Token Pricing**: $0.35/1M prompt • $0.75/1M completion
- **Live Endpoint**: [lotus-max.vercel.app](https://lotus-max.vercel.app)

---

## ⚡ Architecture & Capabilities

Lotus 0.1 Max features:
- **550B Parameter Sovereign Foundation**: Built for high-dimensional reasoning across computer science, theoretical physics, distributed systems, and economics.
- **Sub-Second Streaming**: Native SSE text-streaming with optimized time-to-first-token.
- **Zero Data Retention**: Client prompts and completions are ephemeral in-memory, never stored or used for training.

---

## 🚀 API Endpoints

### 1. List Models Endpoint
```http
GET https://lotus-max.vercel.app/api/v1/models
```

### 2. Chat Completions Endpoint
```http
POST https://lotus-max.vercel.app/api/v1/chat/completions
Content-Type: application/json

{
  "model": "lotus-ai/lotus-0.1-max",
  "messages": [
    {"role": "user", "content": "Explain raft consensus in 2 sentences."}
  ],
  "stream": true
}
```

---

## 🛠️ Local Development

```powershell
npm run dev
# Or build for production
npm run build
npx next start -p 3005
```
Visit `http://localhost:3005`.
