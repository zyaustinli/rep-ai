from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.database import get_supabase
from app.api.deps import get_current_user

router = APIRouter()


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


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    current_user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    """
    Delete a product
    """
    result = supabase.table("products").delete().eq(
        "id", product_id
    ).eq("user_id", current_user.id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")

    return None
