from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


class ProductCreate(BaseModel):
  category_id: int = 1
  product_code: str = ""  # Allow empty for auto-generation
  product_name: str
  description: Optional[str] = ""
  list_price: float
  discount_percent: float = 0.0
  image_url: Optional[str] = None


@router.get("/")
async def get_products():
  try:
    logger.info("Fetching products from products-service")
    async with httpx.AsyncClient() as client:
      # Use the correct URL without trailing slash to avoid redirect
      response = await client.get("http://products-service:8005/products")
      logger.info(f"Products service response status: {response.status_code}")

      if response.status_code == 200:
        products = response.json()
        logger.info(f"Retrieved {len(products)} products")
        return products
      else:
        logger.error(f"Products service returned status {response.status_code}")
        error_text = response.text
        logger.error(f"Error response: {error_text}")
        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch products: {error_text}")
  except httpx.RequestError as e:
    logger.error(f"Request error when connecting to products service: {e}")
    raise HTTPException(status_code=500, detail=f"Failed to connect to product service: {str(e)}")
  except Exception as e:
    logger.error(f"Unexpected error in get_products: {e}")
    raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.post("/")
async def create_product(product: ProductCreate):
  try:
    logger.info(f"Creating product: {product.product_name}")
    async with httpx.AsyncClient() as client:
      response = await client.post(
        "http://products-service:8005/products",
        json=product.dict(),
        headers={"Content-Type": "application/json"}
      )
      logger.info(f"Create product response status: {response.status_code}")

      if response.status_code == 201:
        result = response.json()
        logger.info(f"Product created successfully: {result.get('product_id')}")
        return result
      else:
        error_text = response.text
        logger.error(f"Failed to create product: {error_text}")
        try:
          error_json = response.json()
          detail = error_json.get('detail', error_text)
        except:
          detail = error_text
        raise HTTPException(status_code=response.status_code, detail=f"Failed to create product: {detail}")
  except httpx.RequestError as e:
    logger.error(f"Request error when creating product: {e}")
    raise HTTPException(status_code=500, detail=f"Failed to connect to product service: {str(e)}")
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"Unexpected error in create_product: {e}")
    raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.put("/{product_id}")
async def update_product(product_id: int, product: ProductCreate):
  try:
    logger.info(f"Updating product {product_id}: {product.product_name}")
    async with httpx.AsyncClient() as client:
      response = await client.put(
        f"http://products-service:8005/products/{product_id}",
        json=product.dict(),
        headers={"Content-Type": "application/json"}
      )
      logger.info(f"Update product response status: {response.status_code}")

      if response.status_code == 200:
        result = response.json()
        logger.info(f"Product updated successfully: {product_id}")
        return result
      else:
        error_text = response.text
        logger.error(f"Failed to update product: {error_text}")
        try:
          error_json = response.json()
          detail = error_json.get('detail', error_text)
        except:
          detail = error_text
        raise HTTPException(status_code=response.status_code, detail=f"Failed to update product: {detail}")
  except httpx.RequestError as e:
    logger.error(f"Request error when updating product: {e}")
    raise HTTPException(status_code=500, detail=f"Failed to connect to product service: {str(e)}")
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"Unexpected error in update_product: {e}")
    raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.delete("/{product_id}")
async def delete_product(product_id: int):
  try:
    logger.info(f"Deleting product {product_id}")
    async with httpx.AsyncClient() as client:
      response = await client.delete(f"http://products-service:8005/products/{product_id}")
      logger.info(f"Delete product response status: {response.status_code}")

      if response.status_code == 204:
        logger.info(f"Product {product_id} deleted successfully")
        return {"message": "Product deleted successfully"}
      else:
        error_text = response.text
        logger.error(f"Failed to delete product: {error_text}")
        raise HTTPException(status_code=response.status_code, detail="Failed to delete product")
  except httpx.RequestError as e:
    logger.error(f"Request error when deleting product: {e}")
    raise HTTPException(status_code=500, detail=f"Failed to connect to product service: {str(e)}")
  except HTTPException:
    raise
  except Exception as e:
    logger.error(f"Unexpected error in delete_product: {e}")
    raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@router.get("/categories")
async def get_categories():
  try:
    logger.info("Fetching categories from products-service")
    async with httpx.AsyncClient() as client:
      response = await client.get("http://products-service:8005/categories")
      logger.info(f"Categories response status: {response.status_code}")

      if response.status_code == 200:
        categories = response.json()
        logger.info(f"Retrieved {len(categories)} categories")
        return categories
      else:
        error_text = response.text
        logger.error(f"Failed to fetch categories: {error_text}")
        raise HTTPException(status_code=response.status_code, detail="Failed to fetch categories")
  except httpx.RequestError as e:
    logger.error(f"Request error when fetching categories: {e}")
    raise HTTPException(status_code=500, detail=f"Failed to connect to product service: {str(e)}")
  except Exception as e:
    logger.error(f"Unexpected error in get_categories: {e}")
    raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")
