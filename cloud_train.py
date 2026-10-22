"""
Lotus Project: Serverless Cloud Fine-Tuning Script
=================================================
This script takes your synthesized dataset (lotus_0.1_max_dataset.jsonl)
and launches a fine-tuning job on a serverless GPU cloud (e.g. Together AI, Fireworks, or OpenAI).

You do NOT need your own GPU. The cloud provider:
1. Provisions the GPUs.
2. Fine-tunes the base model (e.g. meta-llama/Meta-Llama-3.1-8B-Instruct).
3. Names your model 'lotus-0.1-max'.
4. Gives you an instant OpenAI-compatible serverless inference endpoint!
"""

import os
import json
import httpx
import time

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY", "YOUR_TOGETHER_API_KEY")
DATASET_PATH = "lotus_0.1_max_dataset.jsonl"
BASE_MODEL = "meta-llama/Meta-Llama-3.1-8B-Instruct-Reference"
NEW_MODEL_NAME = "lotus-0.1-max"

def upload_dataset(file_path: str) -> str:
    """Uploads the training JSONL file to the cloud platform."""
    print(f"Uploading {file_path} to Together AI...")
    headers = {"Authorization": f"Bearer {TOGETHER_API_KEY}"}
    
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, "application/jsonl")}
        data = {"purpose": "fine-tune"}
        response = httpx.post("https://api.together.xyz/v1/files", headers=headers, files=files, data=data, timeout=120)
        
    if response.status_code == 200:
        file_id = response.json().get("id")
        print(f"✅ Uploaded successfully. File ID: {file_id}")
        return file_id
    else:
        raise Exception(f"File upload failed: {response.status_code} - {response.text}")

def start_fine_tune(file_id: str) -> str:
    """Starts the serverless fine-tuning job."""
    print(f"Initiating fine-tuning job for model: {NEW_MODEL_NAME}...")
    headers = {
        "Authorization": f"Bearer {TOGETHER_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "training_file": file_id,
        "model": BASE_MODEL,
        "suffix": NEW_MODEL_NAME,
        "n_epochs": 3,
        "batch_size": 4,
        "learning_rate": 1e-5
    }
    
    response = httpx.post("https://api.together.xyz/v1/fine-tunes", headers=headers, json=payload, timeout=30)
    if response.status_code == 200:
        job = response.json()
        job_id = job.get("id")
        print(f"🚀 Fine-tune job created! Job ID: {job_id}")
        print(f"Status: {job.get('status')}")
        return job_id
    else:
        raise Exception(f"Failed to start fine-tune: {response.status_code} - {response.text}")

def monitor_job(job_id: str):
    """Monitors training progress until completion."""
    headers = {"Authorization": f"Bearer {TOGETHER_API_KEY}"}
    print("Monitoring training job status...")
    
    while True:
        resp = httpx.get(f"https://api.together.xyz/v1/fine-tunes/{job_id}", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            status = data.get("status")
            print(f"Current Status: {status}")
            if status in ["completed", "failed", "cancelled"]:
                if status == "completed":
                    print(f"🎉 Fine-tuning finished! Your model is live as: {data.get('output_name')}")
                    print(f"Inference Endpoint: https://api.together.xyz/v1/chat/completions")
                else:
                    print(f"Job ended with status: {status}")
                break
        else:
            print(f"Error checking status: {resp.status_code}")
        time.sleep(30)

if __name__ == "__main__":
    if TOGETHER_API_KEY == "YOUR_TOGETHER_API_KEY":
        print("Please export TOGETHER_API_KEY or configure it in this script.")
        print("Get your API key from https://api.together.ai")
    else:
        if not os.path.exists(DATASET_PATH):
            print(f"Dataset file {DATASET_PATH} not found. Run knowledge_loop.py first!")
        else:
            file_id = upload_dataset(DATASET_PATH)
            job_id = start_fine_tune(file_id)
            monitor_job(job_id)
