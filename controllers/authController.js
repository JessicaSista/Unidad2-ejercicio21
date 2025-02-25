const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { json } = require("express");
const jwt = require("jsonwebtoken");

async function getToken(req, res) {
  //que no se puedan registrar personas con mismo email o username !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.json({ msg: "Credenciales incorrectas." });

  const isValidPassword = await bcrypt.compare(req.body.password, user.password); //método estático en el modelo !!!!!!!!!!!!!!!!!!!!!!!!!!!!11
  if (!isValidPassword) return res.json({ msg: "Credenciales incorrectas." });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  return res.json(token);
}
async function registerUser(req, res) {
  try {
    const { firstname, lastname, username, email, password, bio, profilePic } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "Email o Username ya están en uso" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      bio,
      profilePic,
    });

    await newUser.save();
    res.status.json({ message: "Usuario registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status.json({ message: "Error en el servidor" });
  }
}

module.exports = { getToken, registerUser };
