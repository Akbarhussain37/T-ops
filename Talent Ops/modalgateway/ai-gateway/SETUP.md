# AI Gateway Setup & Testing Guide

## Quick Start

### 1. Install Ollama
```bash
# Windows: Download installer
# https://ollama.com/download/windows

# OR use WSL/Linux:
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Pull Models (~7GB total)
```bash
ollama pull llama3.2:3b-instruct-q4_K_M
ollama pull llama3.1:8b-instruct-q4_K_M
```

### 3. Install Dependencies
```bash
cd "c:\Users\adity\Desktop\T-ops\Talent Ops\modalgateway\ai-gateway"
pip install -r requirements.txt
```

### 4. Run AI Gateway
```bash
python main.py
```

Expected output:
```
Loading embedding model: sentence-transformers/all-MiniLM-L6-v2
Initializing ChromaDB at ./chroma_db
LLM Gateway initialized
AI Gateway ready!
```

### 5. Test the API

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Sample Query (add documents first):**
```bash
curl -X POST http://localhost:8000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the leave policy?",
    "context": {
      "route": "/employee-dashboard/leaves",
      "module": "leaves",
      "role": "employee",
      "user_id": "test-user"
    }
  }'
```

## Next Steps
1. Add document ingestion script
2. Test RAG retrieval with sample documents
3. Implement smart button generation
4. Connect frontend

## Components Built ✅
- FastAPI REST API
- Embedding service (sentence-transformers)
- Vector DB (ChromaDB)
- LLM Gateway (Ollama)
- Document chunker
- Guardrails (scope + injection detection)
- RAG engine (retrieval + answer generation)

**Cost:** $0.00/month
