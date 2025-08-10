import express from "express";
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// GET /api/admin/products — Retrieves all products from admin service
// Forwards request to admin-service and returns product list
// Used by admin interface for product management
router.get("/products", async (req, res, next) => {
  try {
    const response = await fetch("http://admin-service:8000/admin/products/");
    if (response.ok) {
      const products = await response.json();
      res.json(products);
    } else {
      res.status(response.status).json({ error: "Failed to fetch products" });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products — Creates new product via admin service
// Forwards product creation request with JSON payload
// Returns created product data or error details
router.post("/products", async (req, res, next) => {
  try {
    const productData = req.body;
    const response = await fetch("http://admin-service:8000/admin/products/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(productData)
    });

    if (response.ok) {
      const result = await response.json();
      res.json(result);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id — Deletes product via admin service
// Forwards delete request to admin service for specified product ID
// Returns success message or error details
router.delete("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const response = await fetch(`http://admin-service:8000/admin/products/${id}`, {
      method: "DELETE"
    });

    if (response.ok) {
      res.json({ message: "Product deleted successfully" });
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/uploads — Handles file uploads to admin service
// Processes multipart file upload and forwards to admin service
// Returns uploaded file information including accessible URL
router.post("/uploads", upload.single("file"), async (req, res, next) => {
  try {
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const response = await fetch("http://admin-service:8000/admin/uploads/", {
      method: "POST",
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      res.json(result);
    } else {
      const error = await response.json();
      res.status(response.status).json(error);
    }
  } catch (err) {
    next(err);
  }
});

export default router;
