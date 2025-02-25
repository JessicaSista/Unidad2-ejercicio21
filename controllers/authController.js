const User = require("../models/User");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const { json } = require("express");
const jwt = require("jsonwebtoken");
const userController = require("./userController");

async function getToken(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.json({ msg: "Credenciales incorrectas." });

  const isValidPassword = await User.comparePassword(req.body.password, user.password);
  if (!isValidPassword) return res.json({ msg: "Credenciales incorrectas2." });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  return res.json(token);
}
async function registerUser(req, res) {
  try {
    const form = formidable({
      multiples: false,
      uploadDir: path.join(__dirname, "/../public/img"), //importante poner /../ para ir hacia atrás, solo con ../ NO FUNCIONA
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      const username = fields.username;
      const email = fields.email;
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        const upImage = files.profilePic;
        fs.unlinkSync(upImage.filepath);
        return res.status(400).json({ message: "Email o Username ya están en uso" });
      } else {
        const newUser = await userController.store(fields, files);
        res.status(201).json({ message: "Usuario registrado correctamente" });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}

module.exports = { getToken, registerUser };
