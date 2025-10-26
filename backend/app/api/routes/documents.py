"""
Document management routes for product knowledge
Handles file uploads, processing, and vectorization
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from typing import List
import os
import shutil
from pathlib import Path
import logging

from app.schemas.document import (
    Document,
    DocumentUploadResponse,
    DocumentCreate
)
from app.database import get_supabase
from app.api.deps import get_current_user
from app.services.document_processor import DocumentProcessor
from app.services.vector_service import VectorService

router = APIRouter()
logger = logging.getLogger(__name__)

# File upload settings
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'pdf', 'txt', 'md'}
UPLOAD_DIR = "./uploads"

# Ensure upload directory exists
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)


def validate_file(filename: str, file_size: int):
    """
    Validate uploaded file

    Args:
        filename: Original filename
        file_size: File size in bytes

    Raises:
        HTTPException: If validation fails
    """
    # Check file extension
    extension = filename.split('.')[-1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Check file size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / 1024 / 1024}MB"
        )


@router.post("/{product_id}/documents", response_model=DocumentUploadResponse)
async def upload_document(
    product_id: str,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Upload and process a document (PDF or TXT)

    Flow:
    1. Validate file
    2. Save to disk
    3. Extract text
    4. Chunk text
    5. Create database record
    6. Vectorize chunks
    7. Update database with chunk count
    """
    # Verify product exists and belongs to user
    product_result = supabase.table("products").select("id").eq(
        "id", product_id
    ).eq("user_id", current_user.id).execute()

    if not product_result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    # Read file content to check size
    file_content = await file.read()
    file_size = len(file_content)

    # Validate file
    validate_file(file.filename, file_size)

    # Determine file type
    file_extension = file.filename.split('.')[-1].lower()

    # Create unique file path
    user_dir = Path(UPLOAD_DIR) / current_user.id
    user_dir.mkdir(parents=True, exist_ok=True)

    file_path = user_dir / file.filename

    # Handle duplicate filenames
    counter = 1
    while file_path.exists():
        name_parts = file.filename.rsplit('.', 1)
        new_filename = f"{name_parts[0]}_{counter}.{name_parts[1]}"
        file_path = user_dir / new_filename
        counter += 1

    try:
        # Save file to disk
        with open(file_path, 'wb') as f:
            f.write(file_content)

        logger.info(f"Saved file to {file_path}")

        # Create database record first
        doc_data = {
            "product_id": product_id,
            "user_id": current_user.id,
            "filename": file.filename,
            "file_type": file_extension,
            "file_size": file_size,
            "storage_path": str(file_path),
            "is_vectorized": False
        }

        db_result = supabase.table("product_documents").insert(doc_data).execute()
        document = db_result.data[0]
        document_id = document['id']

        logger.info(f"Created database record for document {document_id}")

        # Process document (extract + chunk)
        processor = DocumentProcessor()
        processed = processor.process_document(str(file_path), file_extension)

        logger.info(
            f"Processed document: {processed['total_chunks']} chunks, "
            f"{processed['total_tokens']} tokens"
        )

        # Vectorize chunks
        vector_service = VectorService()
        chunks_added = await vector_service.add_document_chunks(
            product_id=product_id,
            user_id=current_user.id,
            document_id=document_id,
            document_name=file.filename,
            chunks=processed['chunks']
        )

        logger.info(f"Vectorized {chunks_added} chunks for document {document_id}")

        # Update database record
        update_data = {
            "extracted_text": processed['text'],
            "chunk_count": chunks_added,
            "is_vectorized": True
        }

        supabase.table("product_documents").update(update_data).eq(
            "id", document_id
        ).execute()

        # Note: product.document_count is automatically updated by database trigger

        return DocumentUploadResponse(
            id=document_id,
            filename=file.filename,
            file_type=file_extension,
            file_size=file_size,
            is_vectorized=True,
            message=f"Document uploaded and vectorized successfully ({chunks_added} chunks)"
        )

    except Exception as e:
        logger.error(f"Failed to process document: {str(e)}", exc_info=True)

        # Cleanup on failure
        if file_path.exists():
            try:
                os.remove(file_path)
            except:
                pass

        # Delete database record if created
        try:
            if 'document_id' in locals():
                supabase.table("product_documents").delete().eq(
                    "id", document_id
                ).execute()
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process document: {str(e)}"
        )


@router.get("/{product_id}/documents", response_model=List[Document])
async def list_documents(
    product_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    List all documents for a product
    """
    # Verify product belongs to user
    product_result = supabase.table("products").select("id").eq(
        "id", product_id
    ).eq("user_id", current_user.id).execute()

    if not product_result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get documents
    result = supabase.table("product_documents").select("*").eq(
        "product_id", product_id
    ).eq("user_id", current_user.id).order("created_at", desc=True).execute()

    return result.data


@router.get("/{product_id}/documents/{document_id}", response_model=Document)
async def get_document(
    product_id: str,
    document_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Get a specific document
    """
    # Verify document belongs to user and product
    result = supabase.table("product_documents").select("*").eq(
        "id", document_id
    ).eq("product_id", product_id).eq("user_id", current_user.id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    return result.data[0]


@router.delete("/{product_id}/documents/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    product_id: str,
    document_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Delete a document and its vectors

    Flow:
    1. Verify document exists
    2. Delete vectors from ChromaDB
    3. Delete file from disk
    4. Delete database record (trigger updates product.document_count)
    """
    # Verify document belongs to user and product
    doc_result = supabase.table("product_documents").select("*").eq(
        "id", document_id
    ).eq("product_id", product_id).eq("user_id", current_user.id).execute()

    if not doc_result.data:
        raise HTTPException(status_code=404, detail="Document not found")

    document = doc_result.data[0]
    file_path = document.get('storage_path')

    try:
        # Delete vectors from ChromaDB
        vector_service = VectorService()
        chunks_deleted = vector_service.delete_document_vectors(document_id)

        logger.info(f"Deleted {chunks_deleted} vectors for document {document_id}")

        # Delete file from disk
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
            except Exception as e:
                logger.warning(f"Failed to delete file {file_path}: {str(e)}")

        # Delete database record (trigger will update product.document_count)
        supabase.table("product_documents").delete().eq(
            "id", document_id
        ).execute()

        logger.info(f"Deleted document {document_id}")

        return {
            "message": "Document deleted successfully",
            "document_id": document_id,
            "chunks_deleted": chunks_deleted
        }

    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )
