from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ContentSection(BaseModel):
    """Custom content section for product knowledge"""
    name: str  # Section name (e.g., "Technical Specifications", "Pricing Details")
    content: str  # Rich text content


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    unique_selling_points: Optional[List[str]] = None
    target_market: Optional[str] = None
    competitors: Optional[List[str]] = None

    # RAG-specific fields
    content_sections: Optional[List[ContentSection]] = None  # Custom product knowledge sections


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    unique_selling_points: Optional[List[str]] = None
    target_market: Optional[str] = None
    competitors: Optional[List[str]] = None
    content_sections: Optional[List[ContentSection]] = None


class Product(ProductBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    # RAG metadata
    vectorized_at: Optional[datetime] = None  # When product was last vectorized
    document_count: int = 0  # Number of uploaded documents

    class Config:
        from_attributes = True
