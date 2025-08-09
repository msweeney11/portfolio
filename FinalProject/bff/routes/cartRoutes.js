import express from 'express';
const router = express.Router();
const CART_SERVICE_URL = 'http://cart-service:8004';

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

