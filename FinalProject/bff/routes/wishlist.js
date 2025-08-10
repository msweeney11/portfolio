import express from "express";
import { verifySession } from "../middleware/sessionChecker.js";

const router = express.Router();
const WISHLIST_SERVICE_URL = process.env.WISHLIST_URL || "http://wishlist-service:8008";

// POST /api/wishlist — Adds item to customer's wishlist (protected route)
// Requires session verification, validates required fields, forwards to wishlist service
// Returns created wishlist item with product details or error information
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

// GET /api/wishlist/customer/:customerId — Retrieves customer's complete wishlist
// Forwards customer ID to wishlist service for customer-specific wishlist retrieval
// Returns wishlist items with product details or error on service failure
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

// GET /api/wishlist/customer/:customerId/count — Gets wishlist item count for customer
// Forwards customer ID to wishlist service for count retrieval
// Returns count object or error on service failure
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

// DELETE /api/wishlist/:itemId — Removes specific wishlist item by ID (protected route)
// Requires session verification, forwards item ID to wishlist service
// Returns success message or error on deletion failure
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

// DELETE /api/wishlist/customer/:customerId/product/:productId — Removes product from wishlist (protected route)
// Requires session verification, uses customer and product IDs for specific removal
// Returns success message or error on deletion failure
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

// DELETE /api/wishlist/customer/:customerId/clear — Clears entire customer wishlist (protected route)
// Requires session verification, removes all items from customer's wishlist
// Returns success message or error on clear operation failure
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
