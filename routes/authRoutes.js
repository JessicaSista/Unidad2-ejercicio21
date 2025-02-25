const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

/*
 * API endpoints relacionados a los artículos.
 *
 * Notar que todos estos endpoints tienen como prefijo el string "/articles",
 * tal como se definió en el archivo `routes/index.js`.
 */

router.post("/tokens", authController.getToken);
router.post("/users", authController.registerUser);

module.exports = router;
