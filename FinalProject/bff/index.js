import path from "path";
import { fileURLToPath } from "url";

// Local modules (ESM-compatible)
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
import cartRoutes from "./routes/cartRoutes.js";
import { handleError } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Dynamically import CommonJS modules
  const expressPkg = await import("express");
  const corsPkg = await import("cors");
  const cookieParserPkg = await import("cookie-parser");

  const express = expressPkg.default;
  const cors = corsPkg.default;
  const cookieParser = cookieParserPkg.default;

  const app = express();

  // Fixed CORS configuration
  app.use(cors({
    origin: ["http://localhost:4000", "http://localhost:3000", "http://localhost:5173"],
    credentials: true
  }));

  app.use(express.json());
  app.use(cookieParser());

  // Serve static files first
  app.use(express.static(path.join(__dirname, "frontend")));

  // Root route serves login page
  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
  });

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/cart-items", cartRoutes);

  // Health check
  app.get("/health", (req, res) => {
    res.json({
      service: "bff",
      status: "healthy",
      services: {
        auth: process.env.AUTH_URL || "http://auth-service:8000",
        customer: process.env.CUSTOMER_URL || "http://customer-service:8003",
        products: process.env.PRODUCTS_URL || "http://products-service:8004",
        orders: process.env.ORDER_URL || "http://order-service:8004",
        cart: process.env.CART_URL || "http://cart-service:8005",
        notifications: process.env.NOTIFICATION_URL || "http://notification-service:8006"
      }
    });
  });

  // Catch-all route for SPA
  app.get("*", (req, res) => {
    // If it's an API route that doesn't exist, return 404
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    // Otherwise serve the main HTML file for SPA routing
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
  });

  app.use(handleError);

  app.listen(4000, '0.0.0.0', () => {
    console.log("BFF running on port 4000");
    console.log("Available services:");
    console.log("- Auth Service:", process.env.AUTH_URL || "http://auth-service:8000");
    console.log("- Customer Service:", process.env.CUSTOMER_URL || "http://customer-service:8003");
    console.log("- Products Service:", process.env.PRODUCTS_URL || "http://products-service:8004");
    console.log("- Order Service:", process.env.ORDER_URL || "http://order-service:8004");
  });
}

main();

