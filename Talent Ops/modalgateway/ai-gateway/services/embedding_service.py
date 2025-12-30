from sentence_transformers import SentenceTransformer
import torch
from typing import List
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Free embedding service using sentence-transformers"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
        self.dimension = 384  # all-MiniLM-L6-v2 dimension
        
        # Enable GPU if available
        if torch.cuda.is_available():
            self.model = self.model.to('cuda')
            logger.info("GPU acceleration enabled for embeddings")
        else:
            logger.info("Running embeddings on CPU")
    
    def embed_documents(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """
        Embed multiple documents in batches
        
        Args:
            texts: List of text strings to embed
            batch_size: Batch size for processing
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        logger.info(f"Embedding {len(texts)} documents with batch size {batch_size}")
        
        embeddings = self.model.encode(
            texts,
            batch_size=batch_size,
            show_progress_bar=len(texts) > 100,
            convert_to_numpy=True
        )
        
        return embeddings.tolist()
    
    def embed_query(self, text: str) -> List[float]:
        """
        Embed a single query
        
        Args:
            text: Query string
            
        Returns:
            Embedding vector
        """
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.tolist()
    
    def get_model_version(self) -> str:
        """Get model version for reproducibility"""
        return self.model_name

# Global instance (loaded once at startup)
_embedding_service = None

def get_embedding_service() -> EmbeddingService:
    """Get or create singleton embedding service"""
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
