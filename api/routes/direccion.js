const express = require("express");
const authMiddleware = require("../middleware/session");
const checkRol = require("../middleware/rol");
const {
  getDireccion,
  postDireccion,
  putDireccion,
  postDirEnvio,
} = require("../controllers/direccion");
const router = express.Router();
router.get("/", authMiddleware, checkRol(["User", "Admin"]), getDireccion);
router.post(
  "/dire",
  authMiddleware,
  checkRol(["User", "Admin"]),
  postDireccion
);
router.post("/envi", authMiddleware, checkRol(["User", "Admin"]), postDirEnvio);
router.put("/dire", authMiddleware, checkRol(["User", "Admin"]), putDireccion);

module.exports = router;
