import express from "express";
import { verifySession } from "../middleware/sessionChecker.js";

const router = express.Router();
const ORDER_SERVICE_URL = process.env.ORDER_URL || "http://order-service:8004";

// Create new order
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

// Get orders (optionally filtered by customer)
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

// Get single order
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

// Get customer orders
router.get("/customer/:customerId", verifySession, async (req, res, next) => {
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

// Update order
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

export default router;order-service
