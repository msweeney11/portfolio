import express from "express";
// Remove the node-fetch import if you don't want to install it
import { loginUser, registerUser, verifyLogin } from "../services/fastapiClient.js";
const router = express.Router();

router.post("/login", async (req, res, next) => {
  console.log("Login request received:", req.body);
  try {
    const { email, password } = req.body;

    // Make the request to auth-service and get the full response
    const authResponse = await fetch("http://auth-service:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = await authResponse.json();
    console.log("Login result from auth-service:", result);

    if (result.message === "Logged in") {
      // Set cookies manually using the data returned in the response
      if (result.session_token) {
        res.cookie('session', result.session_token, {
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        });
      }

      if (result.customer_id) {
        res.cookie('customer_id', result.customer_id.toString(), {
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
        });
      }

      console.log("Cookies set manually in BFF");
      return res.status(200).json({ message: "Logged in" });
    }

    res.status(401).json({ error: "Invalid credentials" });
  } catch (err) {
    console.log("Error in BFF login route:", err);
    next(err);
  }
});

// Registration route (mostly unchanged but with cookie forwarding)
router.post("/register", async (req, res, next) => {
  console.log("Registration request received:", req.body);
  try {
    const { name, email, password } = req.body;

    const nameParts = name.trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

const authResponse = await fetch("http://auth-service:8000/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email_address: email,
        password: password,
        first_name: first_name,
        last_name: last_name
      })
    });
    const result = await authResponse.json();
    if (authResponse.ok) {
      // Forward cookies from registration too
      const setCookieHeaders = authResponse.headers.get('set-cookie');
      if (setCookieHeaders) {
        const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
        cookies.forEach(cookie => {
          res.append('Set-Cookie', cookie);
        });
      }
      res.status(201).json({ message: "Account created successfully", customer: result });
    } else {
      res.status(400).json({ error: result.error || "Registration failed" });
    }
  } catch (err) {
    console.log("Error in BFF registration route:", err);
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

router.get("/verify", async (req, res) => {
  try {
    console.log("BFF verify - incoming cookies:", req.headers.cookie);

    // Forward the cookies from the client to auth-service
    const authResponse = await fetch("http://auth-service:8000/auth/verify", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Forward the entire Cookie header from client
        ...(req.headers.cookie ? { Cookie: req.headers.cookie } : {})
      },
      credentials: "include"
    });

    if (!authResponse.ok) {
      return res.status(authResponse.status).json({ error: "Not logged in" });
    }

    const result = await authResponse.json();
    res.status(200).json(result);
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
