import express from "express";
import { loginUser, registerUser } from "../services/fastapiClient.js";
const router = express.Router();

router.post("/login", async (req, res, next) => {
  console.log("Login request received:", req.body);
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    console.log("Login result from auth-service:", result);

    if (result.message === "Logged in") {
      return res.status(200).json({ message: "Logged in" });
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.log("Error in BFF login route:", err);
    next(err);
  }
});

// Add this new registration route
router.post("/register", async (req, res, next) => {
  console.log("Registration request received:", req.body);
  try {
    const { name, email, password } = req.body;

    // Parse name into first and last name
    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const result = await registerUser({
      email_address: email,
      password: password,
      first_name: first_name,
      last_name: last_name
    });

    if (result.customer_id) {
      res.status(201).json({ message: "Account created successfully", customer: result });
    } else {
      res.status(400).json({ error: result.error || "Registration failed" });
    }
  } catch (err) {
    console.log("Error in BFF registration route:", err);
    next(err);
  }
});

export default router;
