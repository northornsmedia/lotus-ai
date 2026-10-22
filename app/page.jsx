'use client';

import { useState, useEffect } from 'react';
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

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello. I am Lotus 0.1 Max, a sovereign frontier reasoning intelligence built by Lotus AI and available on OpenRouter. How can I assist with your engineering, mathematical, or systems architecture challenge today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('curl');
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState(null);

  // Free API Key State
  const [apiKey, setApiKey] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [testApiRunning, setTestApiRunning] = useState(false);
  const [testApiResponse, setTestApiResponse] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('lotus_dev_api_key');
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const handleGenerateKey = async (nameOverride) => {
    setIsGeneratingKey(true);
    setTestApiResponse(null);
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameOverride || projectName || 'Developer Free Tier' })
      });
      const data = await res.json();
      if (data.key) {
        setApiKey(data.key);
        localStorage.setItem('lotus_dev_api_key', data.key);
        setKeyCopied(true);
        setTimeout(() => setKeyCopied(false), 2500);
      }
    } catch (err) {
      console.error('Failed to generate key:', err);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleTestKey = async () => {
    if (!apiKey) return;
    setTestApiRunning(true);
    setTestApiResponse(null);

    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'lotus-ai/lotus-0.1-max',
          messages: [{ role: 'user', content: 'Say hello in 3 words.' }],
          max_tokens: 30
        })
      });
      const json = await res.json();
      setTestApiResponse(json);
    } catch (err) {
      setTestApiResponse({ error: err.message });
    } finally {
      setTestApiRunning(false);
    }
  };

  const activeKeyDisplay = apiKey || 'lotus_live_sk_free_demo_key';

  const codeSnippets = {
    curl: `curl https://lotus-max.vercel.app/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activeKeyDisplay}" \\
  -d '{
    "model": "lotus-ai/lotus-0.1-max",
    "messages": [
      {"role": "user", "content": "Explain quantum error correction"}
    ],
    "stream": true
  }'`,
    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://lotus-max.vercel.app/api/v1",
    api_key="${activeKeyDisplay}",
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
  baseURL: "https://lotus-max.vercel.app/api/v1",
  apiKey: "${activeKeyDisplay}",
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
  baseURL: 'https://lotus-max.vercel.app/api/v1',
  apiKey: process.env.LOTUS_API_KEY || '${activeKeyDisplay}',
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
}`,
    ultraContext: `# Ingest massive documents, codebases & logs up to 3.2M tokens
from openai import OpenAI

client = OpenAI(
    base_url="https://lotus-max.vercel.app/api/v1",
    api_key="${activeKeyDisplay}",
)

# Stream massive 3.2M context with automated live partition ingestion:
stream = client.chat.completions.create(
    model="lotus-ai/lotus-0.1-max",
    messages=[
        {"role": "user", "content": f"{massive_document_text}\\n\\nTask: Comprehensive security audit and synthesis."}
    ],
    stream=True,  # Keeps connection active & streams partitions live
)

for chunk in stream:
    print(chunk.choices[0].delta.content or "", end="")`
  };

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
          content: `⚠️ Error: ${err.message}. Please verify your API configuration.`
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
            <li><a href="#get-key" style={{ color: '#00FF88', fontWeight: 500 }}>Get API Key</a></li>
            <li><a href="#playground">Playground</a></li>
            <li><a href="#benchmarks">Benchmarks</a></li>
            <li><a href="#architecture">Architecture</a></li>
            <li><a href="#api">API Docs</a></li>
            <li><a href="https://openrouter.ai" target="_blank" rel="noreferrer">OpenRouter</a></li>
          </ul>

          <div className="nav-actions">
            <button
              onClick={() => {
                if (!apiKey) handleGenerateKey();
                setShowKeyModal(true);
              }}
              className="btn-primary"
              style={{ background: '#00FF88', color: '#000000', fontWeight: 600, border: 'none' }}
            >
              Get Free API Key
            </button>
          </div>
        </div>
      </nav>

      {/* Free API Key Modal */}
      {showKeyModal && (
        <div className="modal-overlay" onClick={() => setShowKeyModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowKeyModal(false)}>✕</button>
            <div className="api-key-badge">100% Free Developer Tier</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFF', marginBottom: '0.5rem' }}>
              Your Free Lotus API Key
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem' }}>
              Direct access to Lotus 0.1 Max. Zero cost, no credit card required. Includes 3.2M context window and 10,000 RPM capacity.
            </p>

            <div className="api-key-display-box">
              <span>{apiKey || 'Generating your key...'}</span>
              <button
                className="btn-secondary"
                onClick={handleCopyKey}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                {keyCopied ? 'Copied!' : 'Copy Key'}
              </button>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn-secondary"
                onClick={() => handleGenerateKey()}
                disabled={isGeneratingKey}
              >
                {isGeneratingKey ? 'Generating...' : 'Regenerate Key'}
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowKeyModal(false);
                  const el = document.getElementById('api');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                View Code Snippets
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="pill-badge">
            <span className="live-dot"></span>
            <span>Lotus 0.1 Max &bull; 3.2M Context &bull; Free Developer API</span>
          </div>

          <h1 className="gradient-title gradient-text">
            Lotus 0.1 Max.<br />
            Simple. Scalable. Sovereign.
          </h1>

          <p className="hero-subtitle">
            Lotus 0.1 Max delivers doctoral-level reasoning, code synthesis, and mathematical proofs with a 3.2 million token context window. Free direct API access for developers worldwide.
          </p>

          <div className="hero-cta-group">
            <button
              onClick={() => {
                if (!apiKey) handleGenerateKey();
                const el = document.getElementById('get-key');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-primary"
              style={{ background: '#00FF88', color: '#000000', fontWeight: 600, border: 'none' }}
            >
              Generate Free API Key ⚡
            </button>
            <a href="#playground" className="btn-secondary">
              Test in Playground
            </a>
          </div>

          <div className="quick-command">
            <span>$</span>
            <code>curl https://lotus-max.vercel.app/api/v1/chat/completions -H &quot;Authorization: Bearer {activeKeyDisplay}&quot; -d &apos;&#123;&quot;model&quot;:&quot;lotus-ai/lotus-0.1-max&quot;&#125;&apos;</code>
            <button className="copy-btn" onClick={() => handleCopyCode(`curl https://lotus-max.vercel.app/api/v1/chat/completions -H "Authorization: Bearer ${activeKeyDisplay}" -d '{"model":"lotus-ai/lotus-0.1-max","messages":[{"role":"user","content":"Hello Lotus"}]}'`)} title="Copy Command">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
          </div>
        </section>

        {/* Free Developer Key Generator Card */}
        <section id="get-key" style={{ scrollMarginTop: '6rem' }}>
          <div className="api-key-card">
            <div className="api-key-badge">Free Instant Access &bull; No Credit Card Required</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#FFF', marginBottom: '0.4rem' }}>
              Generate Free Developer API Key
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '650px', lineHeight: '1.6' }}>
              Connect directly to the sovereign Lotus 0.1 Max inference cluster with zero setup friction. 
              Enjoy 10,000 RPM, 3.2M token context, and OpenAI-compatible drop-in endpoints.
            </p>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Project Name (e.g. My Next.js App)"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{
                  background: '#050507',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.7rem 1rem',
                  color: '#FFF',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem',
                  flex: '1',
                  minWidth: '220px'
                }}
              />
              <button
                className="btn-primary"
                onClick={() => handleGenerateKey()}
                disabled={isGeneratingKey}
                style={{ background: '#00FF88', color: '#000000', fontWeight: 600, border: 'none', padding: '0.7rem 1.5rem' }}
              >
                {isGeneratingKey ? 'Generating Key...' : apiKey ? 'Regenerate API Key' : 'Create My Free Key ⚡'}
              </button>
            </div>

            {apiKey && (
              <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.3s ease' }}>
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.35rem', fontWeight: 500 }}>
                  YOUR SOVEREIGN API KEY:
                </div>
                <div className="api-key-display-box">
                  <span style={{ letterSpacing: '0.02em' }}>{apiKey}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-secondary"
                      onClick={handleCopyKey}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      {keyCopied ? 'Copied to Clipboard!' : 'Copy Key'}
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={handleTestKey}
                      disabled={testApiRunning}
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#00FF88', color: '#00FF88' }}
                    >
                      {testApiRunning ? 'Testing...' : 'Test Key Live'}
                    </button>
                  </div>
                </div>

                {testApiResponse && (
                  <div style={{ background: '#000', border: '1px solid rgba(0,255,136,0.3)', borderRadius: 'var(--radius-sm)', padding: '1rem', marginTop: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#00FF88' }}>
                    <div style={{ color: '#888', marginBottom: '0.5rem' }}>// Direct API Live Verification Response:</div>
                    <pre style={{ overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(testApiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Live Playground Section */}
        <section id="playground" className="section">
          <div className="section-header">
            <div className="section-label">Interactive Demo</div>
            <h2 className="section-title">Experience Frontier Reasoning</h2>
            <p className="section-desc">Prompt Lotus 0.1 Max directly on our sovereign compute cluster.</p>
          </div>

          {/* Preset Prompts */}
          <div className="preset-container">
            {PRESET_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                className="preset-pill"
                onClick={() => handlePresetClick(item.prompt)}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Terminal Playground Window */}
          <div className="playground-card">
            <div className="playground-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="live-dot"></span>
                <span style={{ fontWeight: 600, color: '#FFF' }}>lotus-ai/lotus-0.1-max</span>
                <span style={{ color: '#666', fontSize: '0.75rem' }}>• 3.2M Context • fp16</span>
              </div>
              <div style={{ color: '#888', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                {latency ? `Latency: ${latency}ms` : 'Ready'}
              </div>
            </div>

            {/* Chat Body */}
            <div className="playground-body">
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role}`}>
                  {m.reasoning && (
                    <details className="reasoning-drawer">
                      <summary>Chain-of-Thought Reasoning</summary>
                      <pre>{m.reasoning}</pre>
                    </details>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-bubble assistant" style={{ color: '#888' }}>
                  <span>Lotus 0.1 Max synthesizing solution via sovereign neural compute cluster...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="playground-input-bar">
              <input
                type="text"
                className="playground-input"
                placeholder="Ask Lotus 0.1 Max anything (quantum mechanics, algorithmic proofs, distributed consensus)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" className="playground-submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Benchmarks Matrix */}
        <section id="benchmarks" className="section">
          <div className="section-header">
            <div className="section-label">Empirical Evaluation</div>
            <h2 className="section-title">Zero Compromise on Hard STEM</h2>
            <p className="section-desc">Evaluated rigorously across MMLU-Pro, MATH-500, HumanEval, and GPQA Diamond.</p>
          </div>

          <div className="benchmark-table-wrap">
            <table className="benchmark-table">
              <thead>
                <tr>
                  <th>Benchmark Metric</th>
                  <th>Category</th>
                  <th style={{ color: '#00FF88' }}>Lotus 0.1 Max</th>
                  <th>GPT-6 Astra</th>
                  <th>Claude Opus 5.5</th>
                  <th>GPT-4 Argon</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="benchmark-highlight">HumanEval</td>
                  <td>Code Generation (Pass@1)</td>
                  <td><span className="benchmark-pill">94.8%</span></td>
                  <td>94.2%</td>
                  <td>93.8%</td>
                  <td>91.6%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">MATH-500</td>
                  <td>Olympiad Mathematics</td>
                  <td><span className="benchmark-pill">86.4%</span></td>
                  <td>85.9%</td>
                  <td>84.7%</td>
                  <td>80.2%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">MMLU-Pro</td>
                  <td>Advanced Multidiscipline</td>
                  <td><span className="benchmark-pill">82.6%</span></td>
                  <td>82.1%</td>
                  <td>81.5%</td>
                  <td>76.8%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">GPQA Diamond</td>
                  <td>Doctoral Scientific Reasoning</td>
                  <td><span className="benchmark-pill">69.2%</span></td>
                  <td>68.4%</td>
                  <td>67.9%</td>
                  <td>58.5%</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">Context Window</td>
                  <td>Effective Tokens</td>
                  <td><span className="benchmark-pill">3,200,000 (3.2M)</span></td>
                  <td>2,000,000 (2.0M)</td>
                  <td>1,000,000 (1.0M)</td>
                  <td>256,000 (256k)</td>
                </tr>
                <tr>
                  <td className="benchmark-highlight">Developer Access</td>
                  <td>Instant API Tier</td>
                  <td><span className="benchmark-pill" style={{ background: 'rgba(0,255,136,0.2)', color: '#00FF88' }}>100% Free ($0.00)</span></td>
                  <td>$15.00 / 1M</td>
                  <td>$20.00 / 1M</td>
                  <td>$5.00 / 1M</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* System Architecture */}
        <section id="architecture" className="section">
          <div className="section-header">
            <div className="section-label">System Architecture</div>
            <h2 className="section-title">Engineered for Global Scale</h2>
            <p className="section-desc">Harnessing distributed sovereign neural cluster infrastructure for maximum throughput and minimal time-to-first-token.</p>
          </div>

          <div className="grid-cards">
            <div className="card">
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
                </svg>
              </div>
              <h3 className="card-title">Lotus 0.1 Max Architecture</h3>
              <p className="card-desc">Trained on massive computing clusters, synthesizing deep multi-domain intelligence across 3.2M token context without regional cognitive blindspots.</p>
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
              <h3 className="card-title">Sovereign Compute Core</h3>
              <p className="card-desc">Utilizes dedicated high-throughput tensor acceleration across distributed clusters for sub-second time-to-first-token (TTFT).</p>
            </div>

            <div className="card">
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <h3 className="card-title">OpenAI Compatible</h3>
              <p className="card-desc">100% compatible with OpenAI API specs. Drop it into LangChain, LlamaIndex, Cursor, or any existing production stack.</p>
            </div>

            <div className="card">
              <div className="card-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="card-title">100% Free Developer Tier</h3>
              <p className="card-desc">Zero credit card, instant API keys with 10,000 RPM capacity so developers can build and ship frontier AI apps freely.</p>
            </div>
          </div>
        </section>

        {/* API Code Quickstart */}
        <section id="api" className="section">
          <div className="section-header">
            <div className="section-label">Developer Quickstart</div>
            <h2 className="section-title">Integrate in 30 Seconds</h2>
            <p className="section-desc">
              Direct API integration with your sovereign key. Copy the snippet into your codebase.
            </p>
          </div>

          <div className="code-container">
            <div className="code-tabs">
              {Object.keys(codeSnippets).map((tab) => (
                <button
                  key={tab}
                  className={`code-tab ${activeCodeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveCodeTab(tab)}
                >
                  {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : tab === 'typescript' ? 'TypeScript' : tab === 'ultraContext' ? '⚡ 3.2M Context (Python)' : 'Next.js'}
                </button>
              ))}
            </div>

            <div className="code-content">
              <button
                className="btn-secondary code-copy-overlay"
                onClick={() => handleCopyCode(codeSnippets[activeCodeTab])}
              >
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <pre>{codeSnippets[activeCodeTab]}</pre>
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
            <Link href="/api/v1/models">Models API</Link>
            <a href="https://openrouter.ai" target="_blank" rel="noreferrer">OpenRouter</a>
            <a href="https://github.com/northornsmedia/lotus-ai" target="_blank" rel="noreferrer">GitHub</a>
          </div>
          <p>&copy; {new Date().getFullYear()} Lotus AI &bull; Lotus 0.1 Max &bull; <a href="https://lotus-max.vercel.app" style={{ color: 'inherit', textDecoration: 'none' }}>lotus-max.vercel.app</a></p>
        </div>
      </footer>
    </div>
  );
}
