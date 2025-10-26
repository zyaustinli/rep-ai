"""
ChromaDB client for vector storage and retrieval
"""
import chromadb
from chromadb.config import Settings
from typing import Optional
import logging
import os

logger = logging.getLogger(__name__)

# Global ChromaDB client instance
_chroma_client: Optional[chromadb.Client] = None
_collection = None


def get_chroma_client(persist_directory: str = "./chroma_data") -> chromadb.Client:
    """
    Get or create a persistent ChromaDB client

    Args:
        persist_directory: Path to persist vector data

    Returns:
        ChromaDB client instance
    """
    global _chroma_client

    if _chroma_client is None:
        # Ensure persist directory exists
        os.makedirs(persist_directory, exist_ok=True)

        # Create persistent client
        _chroma_client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        logger.info(f"ChromaDB client initialized with persist directory: {persist_directory}")

    return _chroma_client


def get_product_collection(reset: bool = False):
    """
    Get or create the product knowledge collection

    Args:
        reset: If True, delete and recreate the collection (USE WITH CAUTION!)

    Returns:
        ChromaDB collection for product knowledge
    """
    global _collection

    client = get_chroma_client()

    collection_name = "product_knowledge"

    if reset:
        try:
            client.delete_collection(name=collection_name)
            logger.warning(f"Collection '{collection_name}' deleted (reset=True)")
        except Exception as e:
            logger.info(f"Collection '{collection_name}' doesn't exist, creating new one")

    # Get or create collection
    _collection = client.get_or_create_collection(
        name=collection_name,
        metadata={
            "description": "Product knowledge base for RAG-powered sales practice",
            "hnsw:space": "cosine"  # Use cosine similarity for semantic search
        }
    )

    # Get collection stats
    vector_count = _collection.count()

    # Get embedding model info
    embedding_model = "all-MiniLM-L6-v2"  # ChromaDB default

    logger.info(
        f"📚 ChromaDB Collection Ready:\n"
        f"   Name: {collection_name}\n"
        f"   Vectors: {vector_count}\n"
        f"   Embedding Model: {embedding_model}\n"
        f"   Similarity Metric: cosine"
    )

    if vector_count == 0:
        logger.warning(
            f"⚠️ ChromaDB collection is EMPTY - no product documents embedded yet. "
            f"Upload documents via /api/products/{{product_id}}/documents endpoint."
        )

    return _collection


def reset_chroma_client():
    """
    Reset the global ChromaDB client (mainly for testing)
    """
    global _chroma_client, _collection
    _chroma_client = None
    _collection = None


# Convenience function to check if ChromaDB is available
def is_chromadb_available() -> bool:
    """
    Check if ChromaDB is available and working

    Returns:
        True if ChromaDB is available, False otherwise
    """
    try:
        client = get_chroma_client()
        # Try to get or create collection to verify it's working
        get_product_collection()
        return True
    except Exception as e:
        logger.error(f"ChromaDB not available: {str(e)}")
        return False
