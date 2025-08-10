import express from 'express';
const router = express.Router();
const CART_SERVICE_URL = 'http://cart-service:8004';

// GET /api/cart-items — Retrieves cart items from cart service
// Forwards request with cookies to cart service for customer identification
// Returns cart items data or 500 error on service failure
router.get('/', async (req, res) => {
  try {
    const cartRes = await fetch(`${CART_SERVICE_URL}/cart-items`, {
      headers: { Cookie: req.headers.cookie }
    });
    const data = await cartRes.json();
    res.status(cartRes.status).json(data);
  } catch (err) {
    console.error("GET /cart-items failed:", err);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});

// POST /api/cart-items — Adds item to cart via cart service
// Forwards item data and cookies to cart service for processing
// Returns created cart item or 500 error on service failure
router.post('/', async (req, res) => {
  try {
    const cartRes = await fetch(`${CART_SERVICE_URL}/cart-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.cookie
      },
      body: JSON.stringify(req.body)
    });
    const data = await cartRes.json();
    res.status(cartRes.status).json(data);
  } catch (err) {
    console.error("POST /cart-items failed:", err);
    res.status(500).json({ error: "Failed to add item to cart" });
  }
});

// DELETE /api/cart-items/:id — Removes item from cart via cart service
// Forwards delete request with item ID and cookies to cart service
// Returns deletion confirmation or 500 error on service failure
router.delete('/:id', async (req, res) => {
  try {
    const cartRes = await fetch(`${CART_SERVICE_URL}/cart-items/${req.params.id}`, {
      method: 'DELETE',
      headers: { Cookie: req.headers.cookie }
    });
    const data = await cartRes.json();
    res.status(cartRes.status).json(data);
  } catch (err) {
    console.error("DELETE /cart-items failed:", err);
    res.status(500).json({ error: "Failed to remove item from cart" });
  }
});

export default router;
