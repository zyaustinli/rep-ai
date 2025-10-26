from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class FileType(str, Enum):
    """Supported file types for document upload"""
    pdf = "pdf"
    txt = "txt"
    md = "md"


class DocumentBase(BaseModel):
    """Base schema for product documents"""
    filename: str
    file_type: FileType
    file_size: int  # in bytes


class DocumentCreate(DocumentBase):
    """Schema for creating a document (from upload)"""
    product_id: str
    storage_path: str
    extracted_text: Optional[str] = None


class DocumentUpdate(BaseModel):
    """Schema for updating a document"""
    extracted_text: Optional[str] = None
    chunk_count: Optional[int] = None
    is_vectorized: Optional[bool] = None


class Document(DocumentBase):
    """Complete document schema"""
    id: str
    product_id: str
    user_id: str
    storage_path: str
    extracted_text: Optional[str] = None
    chunk_count: int = 0
    is_vectorized: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Response after successful document upload"""
    id: str
    filename: str
    file_type: str
    file_size: int
    is_vectorized: bool
    message: str


class VectorizeRequest(BaseModel):
    """Request to vectorize a product's content"""
    product_id: str


class VectorizeResponse(BaseModel):
    """Response after vectorization"""
    product_id: str
    sections_vectorized: int
    documents_vectorized: int
    total_chunks: int
    message: str
