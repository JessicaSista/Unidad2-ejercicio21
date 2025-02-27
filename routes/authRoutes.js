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
router.post("/users", async (req, res) => {
  console.log("📩 Se recibió una petición en /users");
  try {
    await authController.registerUser(req, res);
  } catch (err) {
    console.error("❌ Error en la ruta /users:", err);
    return res.status(500).json({ error: "Error en la creación de usuario" });
  }
});

router.get("/", async (req, res) => {
  try {
    const response = await fetch("https://unidad2-ejercicio21.vercel.app/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "felipe_munozmota@gmail.com",
        password: "1234",
      }),
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
