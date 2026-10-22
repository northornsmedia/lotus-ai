# Lotus 0.1 Max (Global Frontier Architecture)

A global-scale, frontier AI pipeline and web application for **Lotus 0.1 Max**, powered by **NVIDIA NIM** (`https://build.nvidia.com/models`). It uses NVIDIA's computing infrastructure to autonomously generate master-level instruction data, fine-tune models serverless, and publish an official OpenAI-compatible provider endpoint to **OpenRouter**, paired with a Next.js frontend hosted at **`lotus-ai.vercel.app`**.

---

## 🌐 Model Identity: Lotus 0.1 Max

- **Model ID**: `lotus-ai/lotus-0.1-max`
- **Context Length**: 131,072 tokens
- **Inference Infrastructure**: NVIDIA NIM (H100/B200 clusters)
- **Token Pricing**: $0.35/1M prompt • $0.75/1M completion
- **Frontend URL**: [lotus-ai.vercel.app](https://lotus-ai.vercel.app)

---

## ⚡ Active NVIDIA NIM Models

| Model Name | Specs & Role |
| :--- | :--- |
| `nvidia/nemotron-3-ultra-550b-a55b` | **550 Billion Parameter** flagship frontier model for heavy synthesis. |
| `nvidia/nemotron-3.5-lightning-30b-a3b` | 30B deep reasoning model with integrated chain-of-thought (`reasoning_content`). |
| `stepfun-ai/step-5-preview` | Frontier step-5 reasoning engine for logic and factual verification. |
| `meta/llama-3.2-11b-vision-instruct` | Ultra-fast Meta Llama 3.2 model for task formulation and swift completion. |
| `nvidia/llama-3.1-nemotron-safety-guard-8b-v3` | NVIDIA's constitutional alignment and safety guard. |
| `nvidia/riva-translate-4b-instruct-v2` | Global multilingual translation across international languages. |

---

## 🚀 How to Run

### 1. Run the Next.js Frontend
```powershell
npm run dev
# Or production build:
npm run build
npx next start -p 3005
```
Live at `http://localhost:3005`.

### 2. Generate Synthetic Dataset
Launch the autonomous 3-stage distillation loop using your NVIDIA NIM key:
```powershell
python knowledge_loop.py
```
This writes to `lotus_0.1_max_dataset.jsonl`.

### 3. Run the OpenRouter Provider Gateway
```powershell
python openrouter_adapter.py
```
Exposes:
- `GET  /v1/models` — Returns `lotus-ai/lotus-0.1-max`
- `POST /v1/chat/completions` — Routes directly to NVIDIA NIM with full SSE streaming and fallback.

### 4. Deploy to Vercel (`lotus-ai.vercel.app`)
```powershell
npx vercel --prod
```
Set environment variable `NVIDIA_API_KEY` on your Vercel project dashboard.
