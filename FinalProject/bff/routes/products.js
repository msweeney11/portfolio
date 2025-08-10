import express from "express";

const router = express.Router();
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_URL || "http://products-service:8005";

// Get all products - fixed to avoid redirects
router.get("/", async (req, res, next) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${PRODUCTS_SERVICE_URL}/products${queryParams ? '?' + queryParams : ''}`;

    console.log(`Fetching products from: ${url}`);
    const response = await fetch(url);

    if (response.ok) {
      const products = await response.json();
      console.log(`Retrieved ${products.length} products`);
      res.json(products);
    } else {
      console.error(`Products service responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      res.status(response.status).json({ error: "Failed to fetch products", details: errorText });
    }
  } catch (err) {
    console.error("Error fetching products:", err);
    next(err);
  }
});

// Get single product by ID
router.get("/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const url = `${PRODUCTS_SERVICE_URL}/products/${productId}`;

    console.log(`Fetching product from: ${url}`);
    const response = await fetch(url);

    if (response.ok) {
      const product = await response.json();
      console.log(`Retrieved product: ${product.product_name}`);
      res.json(product);
    } else if (response.status === 404) {
      res.status(404).json({ error: "Product not found" });
    } else {
      console.error(`Products service responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      res.status(response.status).json({ error: "Failed to fetch product", details: errorText });
    }
  } catch (err) {
    console.error("Error fetching single product:", err);
    next(err);
  }
});

// Get categories - using a different path to avoid conflicts
router.get("/categories/all", async (req, res, next) => {
  try {
    const url = `${PRODUCTS_SERVICE_URL}/categories`;
    console.log(`Fetching categories from: ${url}`);

    const response = await fetch(url);
    if (response.ok) {
      const categories = await response.json();
      console.log(`Retrieved ${categories.length} categories`);
      res.json(categories);
    } else {
      console.error(`Products service responded with status: ${response.status}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      res.status(response.status).json({ error: "Failed to fetch categories", details: errorText });
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
    next(err);
  }
});

export default router;
