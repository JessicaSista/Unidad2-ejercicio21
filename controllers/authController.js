const User = require("../models/User");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const { json } = require("express");
const jwt = require("jsonwebtoken");
const userController = require("./userController");

// LÓGICA NUEVA
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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
    console.log("Inicio de registerUser");
    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error al analizar el formulario:", err);
        return res.status(400).json({ message: "Error al procesar el formulario" });
      }

      console.log("Campos recibidos:", fields);
      console.log("Archivos recibidos:", files);

      if (!files.profilePic) {
        console.error("No se recibió el archivo profilePic");
        return res.status(400).json({ message: "No se recibió la imagen de perfil" });
      }

      const ext = path.extname(files.profilePic.filepath);
      const newFileName = `image_${Date.now()}${ext}`;
      console.log("Nombre de archivo generado:", newFileName);

      const { data, error } = await supabase.storage
        .from("profilepics")
        .upload(newFileName, fs.createReadStream(files.profilePic.filepath), {
          cacheControl: "3600",
          upsert: false,
          contentType: files.profilePic.mimetype,
        });

      if (error) {
        console.error("Error al subir la imagen a Supabase:", error);
        return res.status(500).json({ message: "Error al subir la imagen de perfil" });
      }

      console.log("Imagen subida exitosamente:", data);

      const existingUser = await User.findOne({ email: fields.email });
      console.log("Usuario existente:", existingUser);

      if (existingUser) {
        await supabase.storage.from("profilepics").remove([newFileName]);
        console.log("Imagen eliminada porque el usuario ya existe");
        return res.status(400).json({ message: "Email o Username ya están en uso" });
      }

      const newUser = await userController.store(fields, files);
      console.log("Usuario creado:", newUser);

      res.status(201).json({ message: "Usuario registrado correctamente" });
    });
  } catch (error) {
    console.error("Error en registerUser:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}

module.exports = { getToken, registerUser };
