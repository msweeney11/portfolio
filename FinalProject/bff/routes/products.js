import express from "express";
import { fetchProducts } from "../services/fastapiClient.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const filters = req.query;
    const products = await fetchProducts(filters);
    res.json(products);
  } catch (err) {
    next(err);
  }
});

export default router;
