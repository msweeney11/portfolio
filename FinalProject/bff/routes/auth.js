import express from "express";
import { loginUser } from "../services/fastapiClient.js";
const router = express.Router();

router.post("/login", async (req, res, next) => {
  console.log("Login request received:", req.body);
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    console.log("Login result from auth-service:", result);

    if (result.message === "Logged in") {
      // Optionally set a cookie if FastAPI sets one
      return res.status(200).json({ message: "Logged in" });
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.log("Error in BFF login route:", err);
    next(err);
  }
});


export default router;
