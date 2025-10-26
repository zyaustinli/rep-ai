from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import logging

from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.database import get_supabase
from app.api.deps import get_current_user
from app.services.vector_service import VectorService

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/", response_model=List[Product])
async def list_products(
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    List all products for current user
    """
    result = supabase.table("products").select("*").eq(
        "user_id", current_user.id
    ).execute()

    return result.data


@router.post("/", response_model=Product, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Create a new product
    """
    product_data = product.model_dump()
    product_data["user_id"] = current_user.id

    result = supabase.table("products").insert(product_data).execute()

    return result.data[0]


@router.get("/{product_id}", response_model=Product)
async def get_product(
    product_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get a specific product
    """
    result = supabase.table("products").select("*").eq(
        "id", product_id
    ).eq("user_id", current_user.id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return result.data[0]


@router.patch("/{product_id}", response_model=Product)
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Update a product
    """
    result = supabase.table("products").update(
        product_update.model_dump(exclude_unset=True)
    ).eq("id", product_id).eq("user_id", current_user.id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return result.data[0]


@router.post("/{product_id}/vectorize")
async def vectorize_product(
    product_id: str,
    force: bool = Query(False, description="Force re-vectorization by deleting existing vectors"),
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Vectorize product content sections and documents

    Flow:
    1. Verify product exists and belongs to user
    2. Optionally delete existing section vectors (if force=true)
    3. Chunk and vectorize all content_sections
    4. Vectorize any un-vectorized documents
    5. Update product.vectorized_at timestamp
    6. Return summary

    Query Parameters:
        force: If true, delete existing section vectors before re-vectorizing

    Returns:
        {
            "product_id": "...",
            "sections_vectorized": 3,
            "documents_vectorized": 2,
            "total_chunks": 45,
            "vectorized_at": "2024-01-15T10:30:00Z"
        }
    """
    # Verify product exists and belongs to user
    product_result = supabase.table("products").select(
        "id, content_sections, user_id"
    ).eq("id", product_id).eq("user_id", current_user.id).execute()

    if not product_result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    product = product_result.data[0]
    content_sections = product.get('content_sections', [])

    vector_service = VectorService()
    total_chunks = 0
    sections_vectorized = 0
    documents_vectorized = 0

    try:
        # Step 1: Handle existing section vectors
        if force:
            deleted_count = vector_service.delete_section_vectors(product_id)
            logger.info(f"Deleted {deleted_count} existing section vectors for product {product_id}")

        # Step 2: Vectorize content sections
        if content_sections:
            from app.schemas.product import ContentSection
            sections = [ContentSection(**section) for section in content_sections]

            result = await vector_service.add_product_sections(
                product_id=product_id,
                user_id=current_user.id,
                sections=sections
            )

            sections_vectorized = result['sections_processed']
            total_chunks += result['total_chunks']

            logger.info(
                f"Vectorized {sections_vectorized} sections "
                f"({result['total_chunks']} chunks) for product {product_id}"
            )

        # Step 3: Get un-vectorized documents
        docs_result = supabase.table("product_documents").select("*").eq(
            "product_id", product_id
        ).eq("is_vectorized", False).execute()

        # Step 4: Vectorize un-vectorized documents
        if docs_result.data:
            from app.services.document_processor import DocumentProcessor
            processor = DocumentProcessor()

            for doc in docs_result.data:
                # Process document
                processed = processor.process_document(
                    doc['storage_path'],
                    doc['file_type']
                )

                # Add to vector store
                chunks_added = await vector_service.add_document_chunks(
                    product_id=product_id,
                    user_id=current_user.id,
                    document_id=doc['id'],
                    document_name=doc['filename'],
                    chunks=processed['chunks']
                )

                # Update document record
                supabase.table("product_documents").update({
                    "extracted_text": processed['text'],
                    "chunk_count": chunks_added,
                    "is_vectorized": True
                }).eq("id", doc['id']).execute()

                documents_vectorized += 1
                total_chunks += chunks_added

                logger.info(
                    f"Vectorized document {doc['filename']} "
                    f"({chunks_added} chunks) for product {product_id}"
                )

        # Step 5: Update product vectorized_at timestamp
        vectorized_at = datetime.utcnow().isoformat()
        supabase.table("products").update({
            "vectorized_at": vectorized_at
        }).eq("id", product_id).execute()

        return {
            "product_id": product_id,
            "sections_vectorized": sections_vectorized,
            "documents_vectorized": documents_vectorized,
            "total_chunks": total_chunks,
            "vectorized_at": vectorized_at,
            "message": f"Successfully vectorized product knowledge ({total_chunks} total chunks)"
        }

    except Exception as e:
        logger.error(f"Failed to vectorize product {product_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to vectorize product: {str(e)}"
        )


@router.post("/{product_id}/query")
async def query_product_knowledge(
    product_id: str,
    query: str = Query(..., description="Natural language query to search product knowledge"),
    top_k: int = Query(5, ge=1, le=20, description="Number of results to return (1-20)"),
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Query product knowledge base using RAG

    Test endpoint for querying vectorized product knowledge.
    This will be used during practice sessions to retrieve relevant information.

    Query Parameters:
        query: Natural language question or search query
        top_k: Number of results to return (default: 5, max: 20)

    Returns:
        {
            "product_id": "...",
            "query": "What is the pricing model?",
            "results": [
                {
                    "text": "chunk text...",
                    "distance": 0.32,
                    "similarity": 0.68,
                    "source_type": "section" | "document",
                    "source_name": "Pricing" | "Brief.pdf",
                    "chunk_index": "2/5",
                    "metadata": {...}
                },
                ...
            ],
            "result_count": 5
        }

    Example:
        POST /api/products/{product_id}/query?query=What%20are%20the%20key%20features&top_k=3
    """
    # Verify product exists and belongs to user
    product_result = supabase.table("products").select("id").eq(
        "id", product_id
    ).eq("user_id", current_user.id).execute()

    if not product_result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        vector_service = VectorService()

        # Query the vector database
        results = await vector_service.query_product_knowledge(
            product_id=product_id,
            query=query,
            top_k=top_k
        )

        logger.info(
            f"Query '{query}' for product {product_id} returned {len(results)} results"
        )

        return {
            "product_id": product_id,
            "query": query,
            "results": results,
            "result_count": len(results)
        }

    except Exception as e:
        logger.error(f"Failed to query product {product_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to query product knowledge: {str(e)}"
        )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Delete a product and all associated data

    Flow:
    1. Verify product exists and belongs to user
    2. Delete all vectors from ChromaDB (sections + documents)
    3. Delete all document files from disk
    4. Delete product (cascades to documents in DB via foreign key)
    """
    # Verify product exists and belongs to user
    product_result = supabase.table("products").select("id").eq(
        "id", product_id
    ).eq("user_id", current_user.id).execute()

    if not product_result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        # Step 1: Delete all vectors from ChromaDB
        vector_service = VectorService()
        deleted_vectors = vector_service.delete_product_vectors(product_id)
        logger.info(f"Deleted {deleted_vectors} vectors for product {product_id}")

        # Step 2: Get all documents to delete files
        docs_result = supabase.table("product_documents").select(
            "storage_path"
        ).eq("product_id", product_id).execute()

        # Step 3: Delete document files from disk
        import os
        deleted_files = 0
        if docs_result.data:
            for doc in docs_result.data:
                file_path = doc.get('storage_path')
                if file_path and os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                        deleted_files += 1
                        logger.info(f"Deleted file: {file_path}")
                    except Exception as e:
                        logger.warning(f"Failed to delete file {file_path}: {str(e)}")

        # Step 4: Delete product from database
        # Foreign key ON DELETE CASCADE will automatically delete:
        # - product_documents records
        supabase.table("products").delete().eq(
            "id", product_id
        ).eq("user_id", current_user.id).execute()

        logger.info(
            f"Deleted product {product_id} "
            f"({deleted_vectors} vectors, {deleted_files} files)"
        )

        return None

    except Exception as e:
        logger.error(f"Failed to delete product {product_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete product: {str(e)}"
        )
