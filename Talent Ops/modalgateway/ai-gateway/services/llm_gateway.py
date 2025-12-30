import ollama
from typing import List, Dict, Any
import logging
import os

logger = logging.getLogger(__name__)

class LLMGateway:
    """Gateway for local LLM inference using Ollama"""
    
    def __init__(
        self,
        ollama_host: str = "http://localhost:11434",
        slm_model: str = "llama3.2:3b-instruct-q4_K_M",
        llm_model: str = "llama3.1:8b-instruct-q4_K_M"
    ):
        self.ollama_host = ollama_host
        self.slm_model = slm_model
        self.llm_model = llm_model
        
        # Configure Ollama client
        os.environ['OLLAMA_HOST'] = ollama_host
        
        logger.info(f"LLM Gateway initialized")
        logger.info(f"SLM: {slm_model}")
        logger.info(f"LLM: {llm_model}")
    
    def query_slm(
        self,
        prompt: str,
        max_tokens: int = 512,
        temperature: float = 0.1
    ) -> Dict[str, Any]:
        """
        Query Small Language Model (3B params)
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (lower = more deterministic)
            
        Returns:
            Response dict with 'response' and metadata
        """
        logger.debug(f"Querying SLM with {len(prompt)} chars")
        
        try:
            response = ollama.generate(
                model=self.slm_model,
                prompt=prompt,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens,
                    "stop": ["</answer>", "\n\n\n"]
                }
            )
            
            return {
                "response": response['response'].strip(),
                "model": self.slm_model,
                "tokens": response.get('eval_count', 0)
            }
        
        except Exception as e:
            logger.error(f"SLM query failed: {e}")
            raise
    
    def query_llm(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 1024,
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """
        Query Large Language Model (8B params)
        
        Args:
            messages: Chat messages [{"role": "user", "content": "..."}]
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Response dict with 'response' and metadata
        """
        logger.debug(f"Querying LLM with {len(messages)} messages")
        
        try:
            response = ollama.chat(
                model=self.llm_model,
                messages=messages,
                options={
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            )
            
            return {
                "response": response['message']['content'].strip(),
                "model": self.llm_model,
                "tokens": response.get('eval_count', 0)
            }
        
        except Exception as e:
            logger.error(f"LLM query failed: {e}")
            raise
    
    def query_with_rag(
        self,
        query: str,
        retrieved_chunks: List[str],
        use_llm: bool = True
    ) -> str:
        """
        Query with RAG context
        
        Args:
            query: User query
            retrieved_chunks: Retrieved document chunks
            use_llm: Use LLM (True) or SLM (False)
            
        Returns:
            Generated answer
        """
        # Build RAG prompt
        context = "\n\n---\n\n".join(retrieved_chunks)
        
        system_prompt = """You are a Talent Ops assistant. Answer ONLY using the provided documents.

CRITICAL RULES:
1. Base your answer ONLY on the provided documents
2. If information is not in documents, respond: "Out of scope: This information is not present in the provided documents."
3. Cite specific sections when answering
4. Do not use external knowledge
5. Be concise and factual

Documents:
{context}

Question: {query}

Answer:"""
        
        prompt = system_prompt.format(context=context, query=query)
        
        if use_llm:
            messages = [
                {"role": "system", "content": "You are a Talent Ops AI assistant. Answer only based on provided documents."},
                {"role": "user", "content": prompt}
            ]
            result = self.query_llm(messages)
        else:
            result = self.query_slm(prompt)
        
        return result['response']

# Global instance
_llm_gateway = None

def get_llm_gateway() -> LLMGateway:
    """Get or create singleton LLM gateway"""
    global _llm_gateway
    if _llm_gateway is None:
        _llm_gateway = LLMGateway()
    return _llm_gateway
