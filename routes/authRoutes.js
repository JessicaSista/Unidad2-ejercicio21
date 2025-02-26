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

router.get("/", async (req, res) => {
  try {
    const response = await fetch("https://tu-dominio.vercel.app/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Si `POST /tokens` requiere datos, agrégalos aquí
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el token", details: error.message });
  }
});

module.exports = router;
