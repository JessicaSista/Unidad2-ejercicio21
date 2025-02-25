const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { expressjwt: checkJwt } = require("express-jwt");

/*
 * API endpoints relacionados a los usuarios.
 *
 * Notar que todos estos endpoints tienen como prefijo el string "/users",
 * tal como se definió en el archivo `routes/index.js`.
 */
router.use(checkJwt({ secret: process.env.JWT_SECRET, algorithms: ["HS256"] }));
router.get("/", userController.index);
router.post("/", userController.store);
router.get("/:id", userController.show);
router.patch("/:id", userController.update);
router.delete("/:id", userController.destroy);
router.get("/:id/followers", userController.getFollowers);
router.get("/:id/following", userController.getFollowing);

module.exports = router;
