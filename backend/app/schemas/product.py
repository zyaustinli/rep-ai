from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    unique_selling_points: Optional[List[str]] = None
    target_market: Optional[str] = None
    competitors: Optional[List[str]] = None


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


class Product(ProductBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
