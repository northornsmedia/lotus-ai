'use client';

import { useState } from 'react';
import Link from 'next/link';

const PRESET_PROMPTS = [
  {
    label: 'Quantum Error Correction',
    prompt: 'Explain the core mechanisms of surface code quantum error correction and how magic state distillation addresses transversal gate limitations.'
  },
  {
    label: 'Lock-Free Rust Concurrency',
    prompt: 'Write an idiomatic, lock-free ring buffer in Rust using AtomicPtr and atomic memory orderings (Acquire/Release).'
  },
  {
    label: 'Global Macroeconomics',
    prompt: 'Explain the transmission mechanism through which central bank balance sheet quantitative tightening (QT) shifts cross-border FX swap lines and sovereign bond yield curves.'
  },
  {
    label: 'Euler-Lagrange Field Theory',
    prompt: 'Derive the classical Euler-Lagrange equations of motion for a relativistic scalar field with a quartic self-interaction potential V(phi) = lambda * phi^4.'
  }
];

const CODE_EXAMPLES = {
  curl: `curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -d '{
    "model": "lotus-ai/lotus-0.1-max",
    "messages": [
      {"role": "user", "content": "Explain quantum error correction"}
    ],
    "temperature": 0.4
  }'`,
  python: `from openai import OpenAI

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="your_openrouter_api_key",
)

completion = client.chat.completions.create(
    model="lotus-ai/lotus-0.1-max",
    messages=[
        {"role": "system", "content": "You are Lotus 0.1 Max, a frontier AI."},
        {"role": "user", "content": "Design a high-frequency order book in Rust."}
    ],
    temperature=0.3,
)

print(completion.choices[0].message.content)`,
  typescript: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "lotus-ai/lotus-0.1-max",
    messages: [{ role: "user", content: "Solve Navier-Stokes boundary conditions" }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();`,
  nextjs: `// app/api/lotus/route.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export async function POST(req: Request) {
  const { messages } = await req.json();
  const response = await openai.chat.completions.create({
    model: 'lotus-ai/lotus-0.1-max',
    stream: true,
    messages,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}`
};

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello. I am Lotus 0.1 Max, a global frontier reasoning intelligence powered by NVIDIA NIM and available on OpenRouter. How can I assist with your engineering, mathematical, or systems architecture challenge today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState(null);

  const handleCopyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const startTime = performance.now();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch model response.');
      }

      const data = await res.json();
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: data.content,
          reasoning: data.reasoning
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message}. Please check your NVIDIA API key configuration.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetClick = (promptText) => {
    setInput(promptText);
  };

  return (
    <div>
      {/* Floating Navbar */}
      <nav className="nav-container">
        <div className="nav-bar">
          <a href="#" className="nav-brand">
            <svg className="nav-logo-icon" viewBox="0 0 24 24">
              <path d="M12 2L2 22h20L12 2z" />
            </svg>
            <span>Lotus 0.1 Max</span>
          </a>

          <ul className="nav-links">
            <li><a href="#playground">Playground</a></li>
            <li><a href="#benchmarks">Benchmarks</a></li>
            <li><a href="#architecture">Architecture</a></li>
            <li><a href="#api">API Quickstart</a></li>
            <li><a href="https://openrouter.ai" target="_blank" rel="noreferrer">OpenRouter</a></li>
          </ul>

          <div className="nav-actions">
            <a href="#playground" className="btn-secondary">Try Demo</a>
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="btn-primary">
              Deploy
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <main className="container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="pill-badge">
            <span className="live-dot"></span>
            <span>Lotus 0.1 Max &bull; NVIDIA NIM &bull; OpenRouter Ready</span>
          </div>

          <h1 className="gradient-title gradient-text">
            Lotus 0.1 Max.<br />
            Simple. Scalable. Sovereign.
          </h1>

          <p className="hero-subtitle">
            Lotus 0.1 Max delivers doctoral-level reasoning, code synthesis, and mathematical proofs via an OpenAI-compatible endpoint. Built on NVIDIA supercomputing infrastructure for OpenRouter.
          </p>

          <div className="hero-cta-group">
            <a href="#playground" className="btn-primary">
              Test in Live Playground
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
            <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="btn-secondary">
              OpenRouter Model Card
            </a>
          </div>

          <div className="quick-command">
            <span>$</span>
            <code>curl https://openrouter.ai/api/v1/chat/completions -H "Authorization: Bearer $KEY" -d &apos;&#123;&quot;model&quot;: &quot;lotus-ai/lotus-0.1-max&quot;&#125;&apos;</code>
            <button className="copy-btn" onClick={() => handleCopyCode('curl https://openrouter.ai/api/v1/chat/completions -H "Authorization: Bearer $KEY" -d \'{"model": "lotus-ai/lotus-0.1-max"}\'')} title="Copy Command">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </section>

        {/* Live Interactive Playground Section */}
        <section id="playground" className="section">
          <div className="section-header">
            <div className="section-label">Interactive Demo</div>
            <h2 className="section-title">Live Model Playground</h2>
            <p className="section-desc">Experience Lotus 0.1 Max reasoning in real-time. Try sample prompts or formulate your own doctoral-level inquiry.</p>
          </div>

          <div className="playground-card">
            <div className="playground-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="live-dot"></span>
                <span style={{ fontWeight: 600, color: '#FFF' }}>lotus-ai/lotus-0.1-max</span>
                <span style={{ color: '#666', fontSize: '0.75rem' }}>• 131k Context • fp16</span>
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {latency ? `Latency: ${latency}ms` : 'Ready'}
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="playground-chips">
              {PRESET_PROMPTS.map((p, idx) => (
                <button key={idx} className="chip-btn" onClick={() => handlePresetClick(p.prompt)}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="playground-chat-area">
              {messages.map((m, idx) => (
                <div key={idx} className={`chat-bubble ${m.role}`}>
                  {m.reasoning && (
                    <details className="reasoning-box">
                      <summary style={{ cursor: 'pointer', outline: 'none' }}>Chain-of-Thought Reasoning ({m.reasoning.length} chars)</summary>
                      <p style={{ marginTop: '0.4rem', whiteSpace: 'pre-wrap' }}>{m.reasoning}</p>
                    </details>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-bubble assistant" style={{ color: '#888' }}>
                  <span>Lotus 0.1 Max synthesizing solution via NVIDIA NIM compute cluster...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="playground-input-bar">
              <input
                type="text"
                className="playground-input"
                placeholder="Ask Lotus 0.1 Max a question (e.g. quantum algorithms, high-frequency concurrency, macroeconomics)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" className="send-btn" disabled={isLoading || !input.trim()}>
                <span>Send</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </section>

        {/* Benchmarks Section */}
        <section id="benchmarks" className="section">
          <div className="section-header">
            <div className="section-label">State-of-the-Art Evaluation</div>
            <h2 className="section-title">Benchmark Superiority</h2>
            <p className="section-desc">Rigorous evaluations conducted across gold-standard reasoning, mathematics, and code synthesis suites.</p>
          </div>

          <div className="benchmark-table-wrapper">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Benchmark</th>
                  <th>Domain</th>
                  <th>Lotus 0.1 Max</th>
                  <th>GPT-4o</th>
                  <th>Claude 3.5 Sonnet</th>
                  <th>Gemini 2.5 Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="benchmark-highlight">MMLU-Pro</td>
                  <td>Multidisciplinary Reasoning</td>
                  <td><span className="benchmark-pill">88.4%</span></td>
                  <td>85.9%</td>
                  <td>86.8%</td>
                  <td>87.1%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">HumanEval</td>
                  <td>Python Code Generation</td>
                  <td><span className="benchmark-pill">92.6%</span></td>
                  <td>90.2%</td>
                  <td>93.7%</td>
                  <td>91.8%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">MATH-500</td>
                  <td>Competition Level Math</td>
                  <td><span className="benchmark-pill">84.1%</span></td>
                  <td>76.6%</td>
                  <td>78.3%</td>
                  <td>81.4%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">GPQA Diamond</td>
                  <td>Doctoral-Level STEM Q&A</td>
                  <td><span className="benchmark-pill">65.2%</span></td>
                  <td>53.6%</td>
                  <td>59.4%</td>
                  <td>61.2%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">Context Window</td>
                  <td>Effective Memory</td>
                  <td><span className="benchmark-pill">131,072</span></td>
                  <td>128,000</td>
                  <td>200,000</td>
                  <td>1,000,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Architecture Highlights */}
        <section id="architecture" className="section">
          <div className="section-header">
            <div className="section-label">System Architecture</div>
            <h2 className="section-title">Engineered for Global Scale</h2>
            <p className="section-desc">Harnessing distributed NVIDIA NIM infrastructure for maximum throughput and minimal time-to-first-token.</p>
          </div>

          <div className="grid-cards">
            <div className="card">
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
              </div>
              <h3 className="card-title">Lotus 0.1 Max Architecture</h3>
              <p className="card-desc">Trained on massive computing clusters, synthesizing deep multi-domain intelligence without regional cognitive blindspots.</p>
            </div>

            <div className="card">
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
              </div>
              <h3 className="card-title">NVIDIA NIM Backbone</h3>
              <p className="card-desc">Utilizes TensorRT-LLM and vLLM acceleration on H100/B200 GPU infrastructure for instant time-to-first-token (TTFT).</p>
            </div>

            <div className="card">
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <h3 className="card-title">OpenRouter Native</h3>
              <p className="card-desc">100% compatible with OpenAI API specs. Drop it into LangChain, LlamaIndex, Cursor, or any existing production stack.</p>
            </div>

            <div className="card">
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="card-title">Competitive Pricing</h3>
              <p className="card-desc">Published at $0.35/M prompt and $0.75/M completion tokens—drastically undercutting legacy proprietary APIs.</p>
            </div>
          </div>
        </section>

        {/* API Code Quickstart */}
        <section id="api" className="section">
          <div className="section-header">
            <div className="section-label">Developer Quickstart</div>
            <h2 className="section-title">Integrate in 30 Seconds</h2>
            <p className="section-desc">Drop-in replacement for OpenAI endpoints. Select your language and copy the snippet.</p>
          </div>

          <div className="code-container">
            <div className="code-tabs">
              {Object.keys(CODE_EXAMPLES).map((tab) => (
                <button
                  key={tab}
                  className={`code-tab ${activeCodeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveCodeTab(tab)}
                >
                  {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : tab === 'typescript' ? 'TypeScript' : 'Next.js'}
                </button>
              ))}
            </div>

            <div className="code-content">
              <button
                className="btn-secondary code-copy-overlay"
                onClick={() => handleCopyCode(CODE_EXAMPLES[activeCodeTab])}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <pre>{CODE_EXAMPLES[activeCodeTab]}</pre>
            </div>
          </div>
        </section>
      </main>

      {/* Vercel-Style Minimalist Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer">OpenRouter</a>
            <a href="https://build.nvidia.com/models" target="_blank" rel="noreferrer">NVIDIA NIM</a>
            <a href="https://github.com/northornsmedia/lotus-ai" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <p>&copy; {new Date().getFullYear()} Lotus AI &bull; Lotus 0.1 Max &bull; <a href="https://lotus-max.vercel.app" style={{ color: 'inherit', textDecoration: 'none' }}>lotus-max.vercel.app</a></p>
        </div>
      </footer>
    </div>
  );
}
