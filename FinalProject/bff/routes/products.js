import express from "express";
import {
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from "../services/fastapiClient.js";

const router = express.Router();

// Get all products
router.get("/", async (req, res, next) => {
  try {
    const products = await fetchProducts();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Get single product
router.get("/:id", async (req, res, next) => {
  try {
    const product = await fetchProductById(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Create product
router.post("/", async (req, res, next) => {
  try {
    const newProduct = await createProduct(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
});

// Update product
router.put("/:id", async (req, res, next) => {
  try {
    const updated = await updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete product
router.delete("/:id", async (req, res, next) => {
  try {
    const success = await deleteProduct(req.params.id);
    res.status(success ? 204 : 500).end();
  } catch (err) {
    next(err);
  }
});

export default router;
