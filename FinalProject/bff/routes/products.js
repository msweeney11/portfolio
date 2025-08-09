import express from "express";

const router = express.Router();
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_URL || "http://products-service:8004";

// Get all products
router.get("/", async (req, res, next) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${PRODUCTS_SERVICE_URL}/products${queryParams ? '?' + queryParams : ''}`;

    const response = await fetch(url);
    if (response.ok) {
      const products = await response.json();
      res.json(products);
    } else {
      res.status(response.status).json({ error: "Failed to fetch products" });
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
    const response = await fetch(`${PRODUCTS_SERVICE_URL}/products/${productId}`);

    if (response.ok) {
      const product = await response.json();
      res.json(product);
    } else if (response.status === 404) {
      res.status(404).json({ error: "Product not found" });
    } else {
      res.status(response.status).json({ error: "Failed to fetch product" });
    }
  } catch (err) {
    console.error("Error fetching single product:", err);
    next(err);
  }
});

// Get categories
router.get("/categories", async (req, res, next) => {
  try {
    const response = await fetch(`${PRODUCTS_SERVICE_URL}/categories`);
    if (response.ok) {
      const categories = await response.json();
      res.json(categories);
    } else {
      res.status(response.status).json({ error: "Failed to fetch categories" });
    }
  } catch (err) {
    console.error("Error fetching categories:", err);
    next(err);
  }
});

export default router;
