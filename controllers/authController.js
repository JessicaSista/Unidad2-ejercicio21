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
  console.log("🔵 Entrando en registerUser");
  try {
    console.log("🚀 Iniciando registerUser");

    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.log("❌ Error al parsear el formulario:", err);
        return res.status(400).json({ message: "Error al procesar el formulario" });
      }

      console.log("✅ Formulario parseado correctamente");
      console.log("📂 Archivos recibidos:", files);
      console.log("📝 Campos recibidos:", fields);

      const ext = path.extname(files.profilePic.filepath);
      const newFileName = `image_${Date.now()}${ext}`;
      console.log("🖼️ Nuevo nombre del archivo:", newFileName);

      const { data, error } = await supabase.storage
        .from("profilepics")
        .upload(newFileName, fs.createReadStream(files.profilePic.filepath), {
          cacheControl: "3600",
          upsert: false,
          contentType: files.profilePic.mimetype,
        });

      if (error) {
        console.log("❌ Error al subir la imagen a Supabase:", error);
        return res.status(500).json({ message: "Error al subir la imagen" });
      }

      console.log("✅ Imagen subida a Supabase:", data);

      // Aquí verificamos si el usuario ya existe antes de continuar
      const existingUser = await User.findOne({ email: fields.email });
      if (existingUser) {
        console.log("⚠️ Usuario ya existe con ese email:", fields.email);

        const { data: deleteData, error: deleteError } = await supabase.storage
          .from("profilepics")
          .remove([newFileName]);

        if (deleteError) {
          console.log("❌ Error al eliminar la imagen de Supabase:", deleteError);
        } else {
          console.log("🗑️ Imagen eliminada de Supabase correctamente:", deleteData);
        }

        return res.status(400).json({ message: "Email o Username ya están en uso" });
      }

      console.log("🆕 Registrando nuevo usuario...");
      const newUser = await userController.store(fields, files);
      console.log("✅ Usuario registrado:", newUser);

      res.status(201).json({ message: "Usuario registrado correctamente" });
    });
  } catch (error) {
    console.log("❌ Error general en registerUser:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}

module.exports = { getToken, registerUser };
