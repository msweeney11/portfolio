import express from "express";
import { verifySession } from "../middleware/sessionChecker.js";

const router = express.Router();
const ORDER_SERVICE_URL = process.env.ORDER_URL || "http://order-service:8004";

// POST /api/orders — Creates new order via order service (protected route)
// Requires session verification, forwards order data to order service
// Returns created order with 201 status or error details
router.post("/", verifySession, async (req, res, next) => {
  try {
    const orderData = req.body;
    const response = await fetch(`${ORDER_SERVICE_URL}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const order = await response.json();
      res.status(201).json(order);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (err) {
    console.error("Error creating order:", err);
    next(err);
  }
});

// GET /api/orders — Retrieves orders with optional query parameters
// Supports filtering via query parameters, forwards to order service
// Returns orders list or error message on service failure
router.get("/", async (req, res, next) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const url = `${ORDER_SERVICE_URL}/orders${queryParams ? '?' + queryParams : ''}`;

    const response = await fetch(url);
    if (response.ok) {
      const orders = await response.json();
      res.json(orders);
    } else {
      res.status(response.status).json({ error: "Failed to fetch orders" });
    }
  } catch (err) {
    console.error("Error fetching orders:", err);
    next(err);
  }
});

// GET /api/orders/:id — Retrieves specific order by ID
// Forwards request to order service with order ID
// Returns order details, 404 if not found, or error on service failure
router.get("/:id", async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const response = await fetch(`${ORDER_SERVICE_URL}/orders/${orderId}`);

    if (response.ok) {
      const order = await response.json();
      res.json(order);
    } else if (response.status === 404) {
      res.status(404).json({ error: "Order not found" });
    } else {
      res.status(response.status).json({ error: "Failed to fetch order" });
    }
  } catch (err) {
    console.error("Error fetching order:", err);
    next(err);
  }
});

// GET /api/orders/customer/:customerId — Retrieves orders for specific customer
// Forwards customer ID to order service for customer-specific order retrieval
// Returns customer orders list or error on service failure
router.get("/customer/:customerId", async (req, res, next) => {
  try {
    const customerId = req.params.customerId;
    const response = await fetch(`${ORDER_SERVICE_URL}/orders/customer/${customerId}/orders`);

    if (response.ok) {
      const orders = await response.json();
      res.json(orders);
    } else {
      res.status(response.status).json({ error: "Failed to fetch customer orders" });
    }
  } catch (err) {
    console.error("Error fetching customer orders:", err);
    next(err);
  }
});

// PUT /api/orders/:id — Updates existing order (protected route)
// Requires session verification, forwards update data to order service
// Returns updated order details or error information
router.put("/:id", verifySession, async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const updateData = req.body;

    const response = await fetch(`${ORDER_SERVICE_URL}/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });

    if (response.ok) {
      const order = await response.json();
      res.json(order);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (err) {
    console.error("Error updating order:", err);
    next(err);
  }
});

export default router;
