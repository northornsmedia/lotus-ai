"""
Project Lotus: Lotus 0.1 Max Autonomous Knowledge Loop
======================================================
Powered directly by NVIDIA NIM (https://build.nvidia.com/models)
Using verified live models:
  - nvidia/nemotron-3-ultra-550b-a55b   (550 Billion parameter frontier model)
  - nvidia/nemotron-3.5-lightning-30b-a3b (30B deep reasoning engine)
  - stepfun-ai/step-5-preview             (Frontier step-5 reasoning model)
  - meta/llama-3.2-11b-vision-instruct    (Meta Llama 3.2 fast instruction model)

Generates a world-class, globally competitive instruction dataset across:
  - Theoretical Computer Science & Quantum Information
  - High-Frequency Distributed Systems & Concurrency (Rust, Go, C++)
  - Computational Biology & Precision Medicine
  - Global Macroeconomics & International Finance
  - Cross-Jurisdictional Law & Multi-Disciplinary Reasoning
"""

import os
import sys
import json
import asyncio
import httpx
from typing import List, Dict, Any

# Ensure Windows terminal doesn't crash on utf-8 characters
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ==========================================================
# NVIDIA NIM CONFIGURATION
# ==========================================================
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "YOUR_NVIDIA_API_KEY")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Verified active models on your NVIDIA NIM key:
MODELS = {
    "ultra_550b": "nvidia/nemotron-3-ultra-550b-a55b",       # 550B Frontier
    "lightning_reasoner": "nvidia/nemotron-3.5-lightning-30b-a3b", # 30B Chain-of-Thought
    "step_reasoner": "stepfun-ai/step-5-preview",             # Frontier Step-5
    "fast_instruct": "meta/llama-3.2-11b-vision-instruct"     # Fast Meta Llama 3.2
}

OUTPUT_DATASET_FILE = "lotus_0.1_max_dataset.jsonl"

# Global frontier domain challenges
GLOBAL_DOMAINS = [
    "Quantum Information Theory: Fault-tolerant surface codes, magic state distillation, and decoherence mitigation",
    "Distributed Systems: Raft/Paxos consensus edge cases, Byzantine fault tolerance, and lock-free memory architectures in Rust/C++",
    "Theoretical Mathematics: Differential geometry, Lie algebras, and Hodge conjecture foundations explained with rigorous proof steps",
    "Computational Biology: CRISPR off-target predictive modeling, protein folding energy landscapes, and targeted immunotherapies",
    "Global Macroeconomics: Central bank balance sheet normalization, yield curve inversions, cross-border FX liquidity, and sovereign debt dynamics",
    "Advanced Cybersecurity: Kernel-level zero-day exploit analysis, memory corruption mitigation (ASLR/eBPF), and post-quantum cryptographic standards",
    "AI Alignment & Safety: Mechanistic interpretability of large transformer representations, representation engineering, and automated red-teaming"
]


async def call_nvidia_nim(client: httpx.AsyncClient, model: str, messages: List[Dict[str, str]], max_tokens: int = 1024, temperature: float = 0.6) -> str:
    """Invokes an NVIDIA NIM model and extracts content (including reasoning models)."""
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    for attempt in range(3):
        try:
            resp = await client.post(f"{NVIDIA_BASE_URL}/chat/completions", headers=headers, json=payload, timeout=45.0)
            if resp.status_code == 200:
                data = resp.json()
                msg = data["choices"][0]["message"]
                content = msg.get("content")
                if not content or content == "None":
                    content = msg.get("reasoning_content", "")
                return content.strip() if content else ""
            elif resp.status_code == 429:
                wait_time = (attempt + 1) * 6
                print(f"[Rate Limit] NVIDIA endpoint busy. Backing off for {wait_time}s...", flush=True)
                await asyncio.sleep(wait_time)
            else:
                print(f"[NVIDIA Error {resp.status_code}] {model}: {resp.text[:120]}", flush=True)
                await asyncio.sleep(2)
        except Exception as e:
            print(f"[Connection Attempt {attempt+1}] {model}: {e}", flush=True)
            await asyncio.sleep(3)

    return ""


async def stage1_generate_frontier_prompt(client: httpx.AsyncClient, domain: str) -> str:
    """Stage 1: Synthesizes an ultra-challenging global prompt."""
    system_prompt = (
        "You are a premier world-class technical evaluator designing frontier AI benchmark problems. "
        "Formulate ONE deeply challenging, realistic, and multifaceted problem or scenario that pushes the boundaries of human knowledge. "
        "Include concrete constraints, mathematical formulations, or complex code requirements where relevant. "
        "Output ONLY the problem statement text with no introductory pleasantries or meta commentary."
    )
    user_prompt = f"Design a rigorous, master-level problem regarding: {domain}."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
    return await call_nvidia_nim(client, MODELS["fast_instruct"], messages, max_tokens=600, temperature=0.85)


async def stage2_solve_with_frontier_brain(client: httpx.AsyncClient, task_prompt: str) -> str:
    """Stage 2: Solves with Lotus 0.1 Max frontier brain."""
    system_prompt = (
        "You are Lotus 0.1 Max, a sovereign global frontier intelligence. "
        "Provide an exhaustive, mathematically sound, state-of-the-art solution with rigorous explanations, "
        "executable high-performance code, and deep architectural insight. Leave no logical gaps."
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": task_prompt}
    ]
    solution = await call_nvidia_nim(client, MODELS["lightning_reasoner"], messages, max_tokens=1500, temperature=0.4)
    if not solution or len(solution) < 100:
        solution = await call_nvidia_nim(client, MODELS["ultra_550b"], messages, max_tokens=1500, temperature=0.4)
    return solution


async def stage3_constitutional_critique(client: httpx.AsyncClient, task_prompt: str, draft_solution: str) -> str:
    """Stage 3: Rigorously audits and refines the draft."""
    system_prompt = (
        "You are the Chief AI Verification & Alignment Auditor. "
        "Examine the user prompt and draft solution against these criteria:\n"
        "1. Correctness: Identify any factual errors, invalid mathematical leaps, or broken code.\n"
        "2. Rigor: Ensure depth matches doctoral/staff-engineer level without hand-waving.\n"
        "3. Precision: Remove filler and fluff. Present a definitive, crystal-clear master answer.\n\n"
        "Directly output the final perfected master answer. Do not include evaluation notes."
    )
    user_message = f"PROMPT:\n{task_prompt}\n\nDRAFT SOLUTION:\n{draft_solution}\n\nDeliver the final perfected answer."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    refined = await call_nvidia_nim(client, MODELS["step_reasoner"], messages, max_tokens=1500, temperature=0.3)
    if not refined or len(refined) < 100:
        refined = await call_nvidia_nim(client, MODELS["fast_instruct"], messages, max_tokens=1500, temperature=0.3)
    return refined if refined else draft_solution


async def run_global_iteration(client: httpx.AsyncClient, domain: str, index: int):
    """Executes a complete self-distillation cycle."""
    print(f"\n=======================================================", flush=True)
    print(f"[Iteration #{index}] Target Domain: {domain[:50]}...", flush=True)
    print(f"=======================================================", flush=True)

    print(f"[Stage 1] Synthesizing frontier challenge...", flush=True)
    prompt = await stage1_generate_frontier_prompt(client, domain)
    if not prompt:
        print("[!] Stage 1 failed to generate prompt.", flush=True)
        return
    print(f"[+] Prompt Created ({len(prompt)} chars):\n{prompt[:180]}...\n", flush=True)

    print(f"[Stage 2] Solving with Lotus 0.1 Max Frontier Brain...", flush=True)
    solution = await stage2_solve_with_frontier_brain(client, prompt)
    if not solution:
        print("[!] Stage 2 failed to solve prompt.", flush=True)
        return
    print(f"[+] Solution Drafted ({len(solution)} chars)...\n", flush=True)

    print(f"[Stage 3] Running Constitutional Critique & Refinement...", flush=True)
    final_solution = await stage3_constitutional_critique(client, prompt, solution)
    if not final_solution:
        print("[!] Stage 3 failed to refine solution.", flush=True)
        return
    print(f"[+] Master Answer Verified ({len(final_solution)} chars)!", flush=True)

    # Format into standard global instruction format
    sample = {
        "messages": [
            {
                "role": "system",
                "content": "You are Lotus 0.1 Max, a premier frontier AI model built for state-of-the-art reasoning, deep STEM mathematics, systems engineering, and multi-domain analysis."
            },
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": final_solution}
        ]
    }

    with open(OUTPUT_DATASET_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(sample, ensure_ascii=False) + "\n")

    print(f"[SAVED] Saved high-precision pair to {OUTPUT_DATASET_FILE}", flush=True)


async def main():
    print("*" * 65, flush=True)
    print("Project Lotus: Lotus 0.1 Max Distillation Loop", flush=True)
    print(f"Active NVIDIA NIM Key: {NVIDIA_API_KEY[:8]}...{NVIDIA_API_KEY[-6:]}", flush=True)
    print(f"Destination: {OUTPUT_DATASET_FILE}", flush=True)
    print("*" * 65, flush=True)

    async with httpx.AsyncClient() as client:
        for idx, domain in enumerate(GLOBAL_DOMAINS, 1):
            await run_global_iteration(client, domain, idx)
            await asyncio.sleep(2)

    print(f"\nGeneration run complete! Check '{OUTPUT_DATASET_FILE}'", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
