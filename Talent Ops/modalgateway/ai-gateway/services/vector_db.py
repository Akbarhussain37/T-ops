import chromadb
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class VectorDBService:
    """ChromaDB vector database service"""
    
    def __init__(self, persist_directory: str = "./chroma_db"):
        logger.info(f"Initializing ChromaDB at {persist_directory}")
        
        # Create persistent client (newer API)
        self.client = chromadb.PersistentClient(path=persist_directory)
        
        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name="talent_ops_docs",
            metadata={"hnsw:space": "cosine"}  # Cosine similarity
        )
        
        logger.info(f"ChromaDB initialized. Collection size: {self.collection.count()}")
    
    def add_documents(
        self,
        chunks: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict[str, Any]],
        ids: List[str]
    ):
        """
        Add documents to vector database
        
        Args:
            chunks: List of text chunks
            embeddings: List of embedding vectors
            metadatas: List of metadata dicts
            ids: List of unique chunk IDs
        """
        logger.info(f"Adding {len(chunks)} chunks to vector DB")
        
        self.collection.add(
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas,
            ids=ids
        )
        
        logger.info(f"Successfully added chunks. Total count: {self.collection.count()}")
    
    def query(
        self,
        query_embedding: List[float],
        filter_dict: Optional[Dict[str, Any]] = None,
        top_k: int = 5
    ) -> Dict[str, Any]:
        """
        Query vector database
        
        Args:
            query_embedding: Query embedding vector
            filter_dict: Metadata filters (ChromaDB where clause)
            top_k: Number of results to return
            
        Returns:
            Query results with documents, metadatas, distances
        """
        logger.debug(f"Querying vector DB with filter: {filter_dict}, top_k: {top_k}")
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            where=filter_dict if filter_dict else None,
            n_results=top_k
        )
        
        # Convert distances to similarity scores (1 - distance for cosine)
        if results['distances'] and results['distances'][0]:
            results['similarities'] = [
                1 - distance for distance in results['distances'][0]
            ]
        
        return results
    
    def get_by_ids(self, ids: List[str]) -> Dict[str, Any]:
        """Get documents by IDs"""
        return self.collection.get(ids=ids)
    
    def delete_document(self, document_id: str):
        """Delete all chunks for a document"""
        self.collection.delete(where={"document_id": document_id})
        logger.info(f"Deleted chunks for document: {document_id}")
    
    def count(self) -> int:
        """Get total number of chunks"""
        return self.collection.count()

# Global instance
_vector_db = None

def get_vector_db(persist_directory: str = "./chroma_db") -> VectorDBService:
    """Get or create singleton vector DB"""
    global _vector_db
    if _vector_db is None:
        _vector_db = VectorDBService(persist_directory)
    return _vector_db
