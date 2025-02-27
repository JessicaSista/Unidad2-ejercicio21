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
    // Envolver form.parse en una Promesa
    const form = formidable({ multiples: false, keepExtensions: true });

    const parseForm = () =>
      new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

    const { fields, files } = await parseForm(); // Esperar a que se resuelva el formulario

    if (!files.avatar) {
      return res.status(400).json({ error: "No se encontró el archivo de imagen" });
    }

    const file = files.avatar;
    const ext = path.extname(file.filepath);
    const newFileName = `image_${Date.now()}${ext}`;

    // Subir el archivo a Supabase
    const { data, error } = await supabase.storage
      .from("avatars") // Asegúrate de que el bucket sea correcto
      .upload(newFileName, fs.createReadStream(file.filepath), {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Verificar si la respuesta de Supabase tiene el path del archivo
    if (!data?.path) {
      return res.status(500).json({ error: "No se pudo obtener la URL de la imagen." });
    }

    // Construir la URL de la imagen pública
    const fileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${data.path}`;

    console.log("File URL:", fileUrl); // Para debug

    // Guardar el usuario con la imagen (esto depende de tu lógica)
    fields.avatarUrl = fileUrl;
    // Aquí deberías almacenar `fields` en la base de datos

    res.status(201).json({ message: "Usuario registrado correctamente", avatarUrl: fileUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor", details: error.message });
  }
}

module.exports = { getToken, registerUser };
