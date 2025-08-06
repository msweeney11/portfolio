import express from "express";
import { loginUser } from "../services/fastapiClient.js";
import { setSessionCookie } from "../services/cookieManager.js";

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);

    if (result.message === "Logged in") {
      // Optionally set a cookie if FastAPI sets one
      return res.status(200).json({ message: "Logged in" });
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    next(err);
  }
});


export default router;
