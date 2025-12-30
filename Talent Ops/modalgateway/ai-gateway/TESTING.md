# Test Document Ingestion

## Quick Test
```bash
cd modalgateway/ai-gateway

# Ingest sample document
python services/ingestion.py sample_docs/leave_policy.txt leave_policy

# Expected output:
# Ingestion result: {'document_id': 'leave_policy', 'chunks_created': X, 'status': 'success'}
```

## Test RAG Query
```bash
curl -X POST http://localhost:8000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the leave escalation process?",
    "context": {
      "route": "/employee-dashboard/leaves",
      "module": "leaves",
      "role": "employee",
      "user_id": "test-user"
    }
  }'
```

Expected response should contain:
- Answer mentioning 3-step escalation
- Source citations
- Confidence > 0.80

## Test Smart Buttons
```bash
curl -X POST http://localhost:8000/api/chatbot/context-buttons \
  -H "Content-Type: application/json" \
  -d '{
    "route": "/employee-dashboard/leaves",
    "module": "leaves",
    "role": "employee",
    "user_id": "test-user"
  }'
```

Expected: 4 buttons specific to employee + leaves page

## Next Steps
1. Install Ollama + pull models
2. Run: `python main.py`
3. Test ingestion
4. Test queries
5. Connect frontend
