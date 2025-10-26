"""
Database module for convo-ai

Includes:
- Supabase client (supabase_client.py)
- ChromaDB client (chroma_client.py)
"""
from .supabase_client import get_supabase
from .chroma_client import (
    get_chroma_client,
    get_product_collection,
    reset_chroma_client,
    is_chromadb_available
)

__all__ = [
    "get_supabase",
    "get_chroma_client",
    "get_product_collection",
    "reset_chroma_client",
    "is_chromadb_available"
]
