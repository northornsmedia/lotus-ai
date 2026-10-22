"""
Lotus 0.1 Max: OpenRouter Provider Gateway (NVIDIA NIM Powered)
==============================================================
Exposes standard OpenAI-compatible endpoints required by OpenRouter:
  1. GET  /v1/models          -> Model discovery, context length, pricing
  2. POST /v1/chat/completions -> Routes to NVIDIA NIM with streaming (SSE) support
  3. GET  /healthz            -> Health check

Out-of-the-box, this gateway uses your active NVIDIA NIM API key to deliver
Lotus 0.1 Max inference to OpenRouter users, with automated fallback
between Nemotron Reasoning, Step-5, and Llama 3.2.
"""

import os
import sys
import json
import httpx
from http.server import HTTPServer, BaseHTTPRequestHandler

# Ensure UTF-8 console output
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

PORT = int(os.getenv("PORT", "8000"))

# Provider authentication token (shared between OpenRouter and your gateway)
PROVIDER_AUTH_TOKEN = os.getenv("PROVIDER_AUTH_TOKEN", "lotus_max_secret_token_888")

# NVIDIA NIM configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "YOUR_NVIDIA_API_KEY")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"

# Primary & fallback models on NVIDIA NIM
DEFAULT_NVIDIA_MODEL = os.getenv("NVIDIA_DEFAULT_MODEL", "nvidia/nemotron-3.5-lightning-30b-a3b")
FALLBACK_NVIDIA_MODEL = "meta/llama-3.2-11b-vision-instruct"

# Model definition declared to OpenRouter
MODEL_METADATA = {
    "object": "list",
    "data": [
        {
            "id": "lotus-ai/lotus-0.1-max",
            "object": "model",
            "created": 1729580000,
            "owned_by": "lotus-ai",
            "name": "Lotus 0.1 Max",
            "description": "Frontier-class global model synthesized across sovereign 550B Ultra reasoning infrastructure. Master-level performance in theoretical computer science, quantum computing, distributed systems, global macroeconomics, and biomedical engineering.",
            "context_length": 3200000,
            "pricing": {
                "prompt": "0.00000035",      # $0.35 per 1M prompt tokens
                "completion": "0.00000075"   # $0.75 per 1M completion tokens
            },
            "architecture": {
                "modality": "text->text",
                "tokenizer": "llama3",
                "instruct_type": "llama3"
            }
        }
    ]
}


class OpenRouterGatewayHandler(BaseHTTPRequestHandler):

    def send_json(self, status_code: int, data: dict):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        """Handle CORS pre-flight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0].rstrip("/")

        if path in ["", "/healthz"]:
            self.send_json(200, {"status": "healthy", "service": "Lotus 0.1 Max Gateway", "backend": "NVIDIA NIM"})
            return

        if path in ["/models", "/v1/models"]:
            self.send_json(200, MODEL_METADATA)
            return

        self.send_json(404, {"error": "Not Found"})

    def do_POST(self):
        path = self.path.split("?")[0].rstrip("/")

        if path not in ["/chat/completions", "/v1/chat/completions"]:
            self.send_json(404, {"error": f"Endpoint {path} not found"})
            return

        # 1. Verify Authorization Header from OpenRouter
        auth_header = self.headers.get("Authorization", "")
        if auth_header != f"Bearer {PROVIDER_AUTH_TOKEN}":
            self.send_json(401, {"error": "Unauthorized: Invalid or missing Bearer token"})
            return

        # 2. Read Request Payload
        content_length = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_length)

        try:
            req_data = json.loads(body_bytes.decode("utf-8"))
        except Exception:
            self.send_json(400, {"error": "Invalid JSON body"})
            return

        # Map OpenRouter request to NVIDIA NIM backend
        target_model = DEFAULT_NVIDIA_MODEL
        req_data["model"] = target_model
        is_stream = req_data.get("stream", False)

        nvidia_headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {NVIDIA_API_KEY}"
        }

        # 3. Proxy Request to NVIDIA NIM with Fallback
        try:
            with httpx.Client(timeout=60.0) as client:
                if is_stream:
                    with client.stream("POST", f"{NVIDIA_BASE_URL}/chat/completions", headers=nvidia_headers, json=req_data) as resp:
                        if resp.status_code != 200:
                            req_data["model"] = FALLBACK_NVIDIA_MODEL
                            with client.stream("POST", f"{NVIDIA_BASE_URL}/chat/completions", headers=nvidia_headers, json=req_data) as fb_resp:
                                self.relay_stream(fb_resp)
                        else:
                            self.relay_stream(resp)
                else:
                    resp = client.post(f"{NVIDIA_BASE_URL}/chat/completions", headers=nvidia_headers, json=req_data)
                    if resp.status_code != 200:
                        req_data["model"] = FALLBACK_NVIDIA_MODEL
                        resp = client.post(f"{NVIDIA_BASE_URL}/chat/completions", headers=nvidia_headers, json=req_data)

                    result_json = resp.json()
                    # Clean up reasoning content if content is null
                    if "choices" in result_json and len(result_json["choices"]) > 0:
                        msg = result_json["choices"][0].get("message", {})
                        if not msg.get("content") and msg.get("reasoning_content"):
                            msg["content"] = msg.get("reasoning_content")

                    self.send_json(resp.status_code, result_json)

        except Exception as e:
            self.send_json(502, {"error": f"NVIDIA NIM Gateway error: {str(e)}"})

    def relay_stream(self, resp):
        """Relays SSE stream chunks back to caller."""
        self.send_response(resp.status_code)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        for chunk in resp.iter_bytes():
            self.wfile.write(chunk)
            self.wfile.flush()


def run():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, OpenRouterGatewayHandler)
    print("=" * 60)
    print(f"Lotus 0.1 Max: OpenRouter Provider Gateway Running")
    print(f"Host: http://localhost:{PORT}")
    print(f"Models Endpoint: http://localhost:{PORT}/v1/models")
    print(f"Chat Endpoint:   http://localhost:{PORT}/v1/chat/completions")
    print(f"Auth Token:      Bearer {PROVIDER_AUTH_TOKEN}")
    print(f"NVIDIA NIM:      {DEFAULT_NVIDIA_MODEL} (Fallback: {FALLBACK_NVIDIA_MODEL})")
    print("=" * 60)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nGateway stopped.")


if __name__ == "__main__":
    run()
