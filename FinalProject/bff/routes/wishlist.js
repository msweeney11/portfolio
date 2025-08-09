import express from "express";
import { verifySession } from "../middleware/sessionChecker.js";

const router = express.Router();
const WISHLIST_SERVICE_URL = process.env.WISHLIST_URL || "http://wishlist-service:8008";

// Add item to wishlist
router.post("/", verifySession, async (req, res, next) => {
  try {
    const { customer_id, product_id } = req.body;

    if (!customer_id || !product_id) {
      return res.status(400).json({ error: "customer_id and product_id are required" });
    }

    const response = await fetch(`${WISHLIST_SERVICE_URL}/wishlist/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id, product_id })
    });

    if (response.ok) {
      const item = await response.json();
      res.status(201).json(item);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    next(err);
  }
});

// Get customer's wishlist
router.get("/customer/:customerId", async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const response = await fetch(`${WISHLIST_SERVICE_URL}/wishlist/customer/${customerId}`);

    if (response.ok) {
      const wishlist = await response.json();
      res.json(wishlist);
    } else {
      res.status(response.status).json({ error: "Failed to fetch wishlist" });
    }
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    next(err);
  }
});

// Get wishlist count
router.get("/customer/:customerId/count", async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const response = await fetch(`${WISHLIST_SERVICE_URL}/wishlist/customer/${customerId}/count`);

    if (response.ok) {
      const result = await response.json();
      res.json(result);
    } else {
      res.status(response.status).json({ error: "Failed to get wishlist count" });
    }
  } catch (err) {
    console.error("Error getting wishlist count:", err);
    next(err);
  }
});

// Remove item from wishlist by item ID
router.delete("/:itemId", verifySession, async (req, res, next) => {
  try {
    const itemId = req.params.itemId;
    const response = await fetch(`${WISHLIST_SERVICE_URL}/wishlist/${itemId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      res.json({ message: "Item removed from wishlist" });
    } else {
      res.status(response.status).json({ error: "Failed to remove item" });
    }
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    next(err);
  }
});

// Remove item from wishlist by customer and product ID
router.delete("/customer/:customerId/product/:productId", verifySession, async (req, res, next) => {
  try {
    const { customerId, productId } = req.params;
    const response = await fetch(`${WISHLIST_SERVICE_URL}/wishlist/customer/${customerId}/product/${productId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      res.json({ message: "Item removed from wishlist" });
    } else {
      res.status(response.status).json({ error: "Failed to remove item" });
    }
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    next(err);
  }
});

// Clear entire wishlist
router.delete("/customer/:customerId/clear", verifySession, async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const response = await fetch(`${WISHLIST_SERVICE_URL}/wishlist/customer/${customerId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      res.json({ message: "Wishlist cleared" });
    } else {
      res.status(response.status).json({ error: "Failed to clear wishlist" });
    }
  } catch (err) {
    console.error("Error clearing wishlist:", err);
    next(err);
  }
});

export default router;
