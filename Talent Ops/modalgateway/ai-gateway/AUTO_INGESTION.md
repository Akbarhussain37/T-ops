# Automatic Document Ingestion Setup

## Environment Variables

Add to `modalgateway/ai-gateway/.env`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

## How Auto-Ingestion Works

### 1. User Uploads Document
- Manager/Executive uploads via **Project Documents** UI
- File → Supabase Storage (`project-docs` bucket)
- Metadata → `project_documents` table

### 2. Automatic RAG Indexing
- Frontend calls: `POST http://localhost:8000/api/ingest/document`
- AI Gateway starts background task
- Downloads file from Supabase Storage
- Chunks document (512 tokens, 128 overlap)
- Generates embeddings (sentence-transformers)
- Stores in ChromaDB

### 3. Chatbot Ready
- Document immediately searchable via chatbot
- Role-based visibility enforced
- Citations include document title

## Endpoint Details

**POST /api/ingest/document**
```json
{
  "document_id": "abc123",
  "file_url": "https://...supabase.co/storage/.../file.txt",
  "document_type": "policy",
  "department": "hr",
  "role_visibility": ["all"],
  "title": "Leave Policy 2024"
}
```

**Response:**
```json
{
  "status": "processing",
  "document_id": "abc123",
  "message": "Document ingestion started in background"
}
```

## Testing

1. **Start AI Gateway:**
```bash
cd modalgateway/ai-gateway
python main.py
```

2. **Upload document via UI:**
- Go to Employee Dashboard → Documents (or Project page)
- Click "Add Document"
- Upload .txt file
- Check console: Should see "✅ Document automatically indexed for chatbot"

3. **Test in chatbot:**
```bash
curl -X POST http://localhost:8000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What does the document say about X?",
    "context": {
      "route": "/employee-dashboard/documents",
      "module": "documents",
      "role": "employee",
      "user_id": "test"
    }
  }'
```

## Supported File Types

Currently:
- ✅ .txt files
- ✅ .md files

Coming soon:
- PDF (.pdf)
- Word (.docx)
- Rich text

## Performance

- Small doc (~10 pages): ~2-3 seconds
- Medium doc (~50 pages): ~10-15 seconds
- Large doc (~100+ pages): ~30-60 seconds

Processing happens in **background** - user doesn't wait!

## Troubleshooting

**"Document ingestion failed":**
- Check AI Gateway is running
- Verify Supabase credentials in .env
- Check file is publicly accessible

**"Document not found in chatbot":**
- Wait ~30 seconds for background processing
- Check AI Gateway logs
- Verify ChromaDB has chunks (see health endpoint)

## Next Steps
1. Add support for PDF/DOCX
2. Add indexing status to UI
3. Add re-indexing on document update
