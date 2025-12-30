# Talent Ops AI Gateway Setup

## Prerequisites
- Python 3.10+
- 8GB RAM minimum (16GB recommended)
- 10GB disk space

## Installation Steps

### 1. Install Ollama
```bash
# Windows: Download from https://ollama.com/download/windows
# Or use WSL/Linux:
curl -fsSL https://ollama.com/install.sh | sh
``

`

### 2. Pull Models
```bash
# SLM (3B, ~2GB)
ollama pull llama3.2:3b-instruct-q4_K_M

# LLM (8B, ~5GB)
ollama pull llama3.1:8b-instruct-q4_K_M
```

### 3. Install Python Dependencies
```bash
cd modalgateway/ai-gateway
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
# Copy template
cp .env.template .env

# Edit .env and add your Supabase credentials
```

### 5. Run the Service
```bash
# Development
python main.py

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 6. Verify Installation
```bash
# Check health
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "healthy",
#   "vector_db": "connected",
#   "document_count": 0,
#   "embedding_model": "loaded",
#   "llm": "connected"
# }
```

## Next Steps
1. Implement RAG pipeline
2. Add document ingestion
3. Build guardrails
4. Create smart button logic
5. Test with frontend

## Troubleshooting

**Ollama not found:**
- Ensure Ollama is running: `ollama serve`
- Check OLLAMA_HOST in .env

**Model download failed:**
- Check internet connection
- Verify disk space (~10GB needed)

**Out of memory:**
- Use CPU instead of GPU
- Reduce batch size in services

Cost: **$0.00/month** ✅
