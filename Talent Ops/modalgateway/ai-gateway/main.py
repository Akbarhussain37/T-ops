from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import List
import logging
import httpx
from supabase import create_client, Client

from models.schemas import (
    ChatQuery, ChatResponse, SmartButton, 
    ButtonActionRequest, PageContext, UserRole
)
from services.embedding_service import get_embedding_service
from services.vector_db import get_vector_db
from services.llm_gateway import get_llm_gateway
from services.rag_engine import get_rag_engine
from services.smart_buttons import get_button_generator
from services.ingestion import DocumentIngestion
import os
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load models
    logger.info("Starting AI Gateway...")
    logger.info("Loading embedding model...")
    get_embedding_service()
    logger.info("Initializing vector DB...")
    get_vector_db()
    logger.info("Initializing LLM gateway...")
    get_llm_gateway()
    logger.info("Initializing RAG engine...")
    get_rag_engine()
    logger.info("AI Gateway ready!")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Gateway...")

# Create FastAPI app
app = FastAPI(
    title="Talent Ops AI Gateway",
    description="Zero-cost AI chatbot with RAG",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "service": "Talent Ops AI Gateway",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check vector DB
        vector_db = get_vector_db()
        doc_count = vector_db.count()
        
        return {
            "status": "healthy",
            "vector_db": "connected",
            "document_count": doc_count,
            "embedding_model": "loaded",
            "llm": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")

@app.post("/api/chatbot/query", response_model=ChatResponse)
async def chat_query(query: ChatQuery):
    """
    Process chatbot query with RAG
    
    This endpoint:
    1. Validates query scope
    2. Retrieves relevant documents
    3. Generates answer using LLM/SLM
    4. Returns grounded response
    """
    logger.info(f"Processing query from {query.context.role} on {query.context.module}")
    
    try:
        # Use RAG engine
        rag_engine = get_rag_engine()
        
        response = rag_engine.query(
            query=query.query,
            role=query.context.role,
            page_module=query.context.module,
            tagged_doc_id=query.tagged_doc.document_id if query.tagged_doc else None
        )
        
        return response
    
    except Exception as e:
        logger.error(f"Query processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatbot/context-buttons", response_model=List[SmartButton])
async def get_context_buttons(context: PageContext):
    """
    Get 4 smart buttons based on role and page context
    """
    logger.info(f"Generating buttons for {context.role} on {context.module}")
    
    try:
        button_generator = get_button_generator()
        buttons = button_generator.generate_buttons(context)
        return buttons
    
    except Exception as e:
        logger.error(f"Button generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chatbot/button-action")
async def handle_button_action(request: ButtonActionRequest):
    """Handle smart button click"""
    logger.info(f"Button action: {request.button_id}")
    
    try:
        # TODO: Implement button action handling
        return {"message": "Button action handler coming soon"}
    
    except Exception as e:
        logger.error(f"Button action failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Document Ingestion API
class IngestRequest(BaseModel):
    document_id: str
    file_url: str  # Supabase Storage URL
    document_type: str
    department: str = "general"
    role_visibility: list = ["all"]
    title: str

@app.post("/api/ingest/document")
async def ingest_document(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Automatically ingest document from Supabase Storage into RAG
    
    Called by frontend after document upload:
    1. Download from Supabase Storage
    2. Chunk document
    3. Generate embeddings
    4. Store in ChromaDB
    """
    logger.info(f"Ingestion request for document: {request.document_id}")
    
    try:
        # Run ingestion in background
        background_tasks.add_task(
            ingest_document_background,
            request.document_id,
            request.file_url,
            request.document_type,
            request.department,
            request.role_visibility,
            request.title
        )
        
        return {
            "status": "processing",
            "document_id": request.document_id,
            "message": "Document ingestion started in background"
        }
    
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def ingest_document_background(
    document_id: str,
    file_url: str,
    document_type: str,
    department: str,
    role_visibility: list,
    title: str
):
    """
    Background task for document ingestion
    """
    try:
        logger.info(f"Starting background ingestion for {document_id}")
        
        # Initialize Supabase client
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            logger.error("Supabase credentials not configured")
            return
        
        # Download file from Supabase Storage
        async with httpx.AsyncClient() as client:
            response = await client.get(file_url)
            
            if response.status_code != 200:
                logger.error(f"Failed to download file: {response.status_code}")
                return
            
            content = response.text
        
        logger.info(f"Downloaded file: {len(content)} chars")
        
        # Initialize ingestion service
        ingestion = DocumentIngestion()
        chunker = ingestion.chunker
        embedding_service = ingestion.embedding_service
        vector_db = ingestion.vector_db
        
        # Chunk document
        metadata = {
            "document_type": document_type,
            "department": department,
            "role_visibility": role_visibility,
            "version": "1.0",
            "title": title
        }
        
        chunks = chunker.chunk_document(
            text=content,
            document_id=document_id,
            document_type=document_type,
            metadata=metadata
        )
        
        logger.info(f"Created {len(chunks)} chunks")
        
        # Generate embeddings
        chunk_texts = [c["content"] for c in chunks]
        embeddings = embedding_service.embed_documents(chunk_texts)
        
        logger.info(f"Generated {len(embeddings)} embeddings")
        
        # Prepare metadata for ChromaDB
        chunk_ids = [c["chunk_id"] for c in chunks]
        chunk_metadatas = [
            {
                "document_id": c["document_id"],
                "document_type": c["document_type"],
                "section_title": c.get("section_title"),
                "department": c.get("department"),
                "role_visibility": c.get("role_visibility"),
                "version": c.get("version"),
                "title": c.get("title")
            }
            for c in chunks
        ]
        
        # Store in ChromaDB
        vector_db.add_documents(
            chunks=chunk_texts,
            embeddings=embeddings,
            metadatas=chunk_metadatas,
            ids=chunk_ids
        )
        
        logger.info(f"✅ Successfully ingested document: {document_id} ({len(chunks)} chunks)")
        
        # TODO: Update project_documents table with indexed=true
        
    except Exception as e:
        logger.error(f"Background ingestion failed for {document_id}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
