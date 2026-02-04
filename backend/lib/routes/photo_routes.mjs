// Upload-Routen (API-Endpunkte fürs Foto-Upload)
import express from "express";

// Controller fürs Hochladen
import { uploadPhoto, deletePhoto } from "../controllers/photo_ctrl.mjs";

// Token prüfen (holt userID aus Auth-Service)
import { verifyToken } from "../services/fetch_auth.mjs";

const router = express.Router();

// Healthcheck zum Testen ob Route überhaupt da ist
router.get("/upload/_ping", (req, res) => {
  res.json({ ok: true });
});

// Upload-Endpunkt
router.post("/upload", verifyToken, async (req, res, next) => {
  // Adapter: Controller erwartet req.user.Id, middleware liefert req.userId
  req.user = req.user || {};
  req.user.Id = req.userId;

  console.log("/upload request received for user:", req.userId);

  return uploadPhoto(req, res, next);
});

router.delete("/photos/:publicID", verifyToken, async (req, res, next) => {
  // Adapter: Controller erwartet req.user.Id, middleware liefert req.userId
  req.user = req.user || {};
  req.user.Id = req.userId;
  return deletePhoto(req, res, next);
});

export default router;
