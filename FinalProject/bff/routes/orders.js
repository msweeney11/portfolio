import express from "express";
import { fetchOrderHistory } from "../services/fastapiClient.js";
import { verifySession } from "../middleware/sessionChecker.js";

const router = express.Router();

router.get("/", verifySession, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await fetchOrderHistory(userId);
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

export default router;
