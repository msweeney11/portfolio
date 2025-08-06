import path from "path";
import { fileURLToPath } from "url";

// Local modules (ESM-compatible)
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";
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

  app.use(cors({ origin: "http://localhost:5173", credentials: true }));
  app.use(express.json());
  app.use(cookieParser());


  app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "login.html"));
  });
  app.use(express.static(path.join(__dirname, "frontend")));

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use(handleError);

  app.listen(4000, '0.0.0.0', () => console.log("BFF running on port 4000"));
}

main();
