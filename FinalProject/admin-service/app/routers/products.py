from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx

router = APIRouter()

class ProductCreate(BaseModel):
    category_id: int = 1
    product_code: str
    product_name: str
    description: Optional[str] = ""
    list_price: float
    discount_percent: float = 0.0

@router.get("/")
async def get_products():
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get("http://fastapi:8000/products/")
            if response.status_code == 200:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch products")
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Failed to connect to product service")

@router.post("/")
async def create_product(product: ProductCreate):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://fastapi:8000/products/",
                json=product.dict()
            )
            if response.status_code == 201:
                return response.json()
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to create product")
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Failed to connect to product service")

@router.delete("/{product_id}")
async def delete_product(product_id: int):
    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"http://fastapi:8000/products/{product_id}")
            if response.status_code == 204:
                return {"message": "Product deleted successfully"}
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to delete product")
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Failed to connect to product service")
