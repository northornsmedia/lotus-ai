"""
Lotus 0.1 Max: High-Speed Concurrent Dataset Generator
=====================================================
- 10 concurrent workers
- Direct access to sovereign 550B model
- Loads key automatically from .env.local
- Real-time pair generation and progress reporting
"""

import os
import sys
import json
import asyncio
import httpx

# Fix Windows console encoding
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def get_api_key():
    key = os.getenv("NVIDIA_API_KEY")
    if key and key.startswith("nvapi-"):
        return key
    env_file = os.path.join(os.path.dirname(__file__), ".env.local")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("NVIDIA_API_KEY="):
                    return line.strip().split("=", 1)[1].strip()
    return "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"

NVIDIA_API_KEY = get_api_key()
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
MODEL = "nvidia/nemotron-3-ultra-550b-a55b"

OUTPUT_FILE = "lotus_0.1_max_dataset.jsonl"
CONCURRENCY_LIMIT = 8
TARGET_PAIRS = 500

DOMAINS = [
    "Quantum Error Correction & Surface Codes",
    "Distributed Consensus (Raft/Paxos/BFT) in Rust",
    "High-Frequency Order Books & Lock-Free Queues",
    "Algorithmic Proofs & Advanced Discrete Mathematics",
    "CRISPR Targeted Therapeutics & Structural Proteomics",
    "Central Banking FX Liquidity & Sovereign Yield Curves",
    "Kernel Security Exploitation & eBPF Sandboxing",
    "Compiler Design: LLVM Intermediate Representation & Optimizations"
]

class Counter:
    def __init__(self):
        self.count = 0
        self.lock = asyncio.Lock()

    async def increment(self, n=1):
        async with self.lock:
            self.count += n
            return self.count

counter = Counter()

# Count existing pairs in output file
if os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, "r", encoding="utf-8", errors="ignore") as f:
        counter.count = sum(1 for line in f if line.strip())

async def generate_batch(client: httpx.AsyncClient, sem: asyncio.Semaphore, domain: str, batch_id: int):
    async with sem:
        headers = {
            "Authorization": f"Bearer {NVIDIA_API_KEY}",
            "Content-Type": "application/json"
        }

        prompt = (
            f"You are the Lead Dataset Architect for Lotus 0.1 Max.\n"
            f"Generate exactly 2 deeply technical, master-level problem-solution pairs for: {domain}.\n"
            f"For each pair, provide an intricate problem specification and an exhaustive, mathematically rigorous solution.\n"
            f"Format strictly as a valid JSON array of objects:\n"
            f'[\n  {{"instruction": "problem 1", "output": "solution 1"}},\n  {{"instruction": "problem 2", "output": "solution 2"}}\n]\n'
            f"Output ONLY the JSON array without backticks or markdown preamble."
        )

        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": "You are a master scientific dataset generator for Lotus 0.1 Max. Output raw JSON only."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.4,
            "max_tokens": 1500
        }

        try:
            resp = await client.post(f"{NVIDIA_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=35.0)
            if resp.status_code == 200:
                raw_text = resp.json()["choices"][0]["message"].get("content", "").strip()
                
                # Strip markdown code fences if present
                if "```json" in raw_text:
                    raw_text = raw_text.split("```json", 1)[1].split("```", 1)[0].strip()
                elif "```" in raw_text:
                    raw_text = raw_text.split("```", 1)[1].split("```", 1)[0].strip()

                # Clean bracket boundaries
                start_idx = raw_text.find("[")
                end_idx = raw_text.rfind("]")
                if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                    json_str = raw_text[start_idx:end_idx+1]
                    try:
                        pairs = json.loads(json_str)
                        if isinstance(pairs, list):
                            saved = 0
                            with open(OUTPUT_FILE, "a", encoding="utf-8") as f:
                                for item in pairs:
                                    if isinstance(item, dict) and "instruction" in item and "output" in item:
                                        sample = {
                                            "messages": [
                                                {"role": "system", "content": "You are Lotus 0.1 Max, a sovereign frontier AI model built for state-of-the-art reasoning, code, and mathematics."},
                                                {"role": "user", "content": str(item["instruction"])},
                                                {"role": "assistant", "content": str(item["output"])}
                                            ]
                                        }
                                        f.write(json.dumps(sample, ensure_ascii=False) + "\n")
                                        saved += 1

                            total = await counter.increment(saved)
                            print(f"[Worker #{batch_id:03d}] +{saved} pairs saved from '{domain[:25]}' (Total: {total}/{TARGET_PAIRS})", flush=True)
                            return saved
                    except json.JSONDecodeError:
                        pass
            elif resp.status_code == 429:
                print(f"[Worker #{batch_id:03d}] Rate limited (429), backing off...", flush=True)
                await asyncio.sleep(4)
            else:
                print(f"[Worker #{batch_id:03d}] API returned {resp.status_code}: {resp.text[:60]}", flush=True)
        except Exception as e:
            print(f"[Worker #{batch_id:03d}] Request timeout/retry ({str(e)[:30]})", flush=True)

    return 0

async def main():
    print("=" * 65, flush=True)
    print(f"🚀 Lotus 0.1 Max: Concurrent Dataset Generator Starting")
    print(f"Model: {MODEL}")
    print(f"Output File: {OUTPUT_FILE} (Current count: {counter.count})")
    print(f"Target: {TARGET_PAIRS} pairs")
    print("=" * 65, flush=True)

    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)
    async with httpx.AsyncClient() as client:
        batch_id = 0
        while counter.count < TARGET_PAIRS:
            batch_id += 1
            domain = DOMAINS[batch_id % len(DOMAINS)]
            # Run tasks in parallel waves
            tasks = [generate_batch(client, sem, DOMAINS[(batch_id + i) % len(DOMAINS)], batch_id + i) for i in range(CONCURRENCY_LIMIT)]
            await asyncio.gather(*tasks)
            await asyncio.sleep(0.5)

    print(f"\n🎉 DONE! Generated {counter.count} pairs in {OUTPUT_FILE}", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
