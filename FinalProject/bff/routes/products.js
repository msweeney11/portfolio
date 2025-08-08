import express from "express";
import { fetchProducts, fetchSingleProduct } from "../services/fastapiClient.js";

const router = express.Router();

// Get all products
router.get("/", async (req, res, next) => {
  try {
    const filters = req.query;
    const products = await fetchProducts(filters);
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    next(err);
  }
});

// Get single product by ID
router.get("/:id", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const product = await fetchSingleProduct(productId);
    res.json(product);
  } catch (err) {
    console.error("Error fetching single product:", err);
    if (err.message.includes("404")) {
      return res.status(404).json({ error: "Product not found" });
    }
    next(err);
  }
});

export default router;
