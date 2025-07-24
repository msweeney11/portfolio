import express from "express";
import multer from "multer";
import { createProduct, uploadImage } from "../services/fastapiClient.js";
import { verifySession } from "../middleware/sessionChecker.js";

const upload = multer({ dest: "uploads/" }); // Temporary path

const router = express.Router();

router.post("/create", verifySession, async (req, res, next) => {
  try {
    const productData = req.body;
    const result = await createProduct(productData);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/upload", verifySession, upload.single("image"), async (req, res, next) => {
  try {
    const result = await uploadImage(req.file);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
