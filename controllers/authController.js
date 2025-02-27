const User = require("../models/User");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
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
    const form = formidable({ multiples: false, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Error al procesar el formulario:", err);
        return res.status(400).json({ error: "Error al procesar el formulario" });
      }

      console.log("Campos recibidos:", fields);
      console.log("Archivos recibidos:", files);

      const username = fields.username;
      const email = fields.email;

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });

      if (existingUser) {
        console.warn("Usuario ya existente:", existingUser);

        // Si hay imagen subida, eliminarla de Supabase
        if (files.profilePic) {
          const { error } = await supabase.storage
            .from("profilepics")
            .remove([files.profilePic.filepath]);

          if (error) {
            console.error("Error eliminando imagen de Supabase:", error);
          }
        }

        return res.status(400).json({ message: "Email o Username ya están en uso" });
      }

      // Si no existe, subir imagen y registrar usuario
      if (!files.profilePic) {
        return res.status(400).json({ error: "No se encontró la imagen de perfil" });
      }

      const profilePicFile = files.profilePic;

      if (!fs.existsSync(profilePicFile.filepath)) {
        console.error("El archivo no existe en la ruta:", profilePicFile.filepath);
        return res.status(500).json({ error: "Error al acceder al archivo" });
      }

      const ext = path.extname(profilePicFile.originalFilename);
      const newFileName = `image_${Date.now()}${ext}`;

      const { data, error } = await supabase.storage
        .from("profilepics")
        .upload(newFileName, fs.createReadStream(profilePicFile.filepath), {
          cacheControl: "3600",
          upsert: false,
          contentType: profilePicFile.mimetype,
        });

      if (error) {
        console.error("Error al subir imagen a Supabase:", error);
        return res.status(500).json({ error: "Error al subir imagen" });
      }

      // Crear usuario
      try {
        const newUser = await userController.store(fields, files);
        res.status(201).json({ message: "Usuario registrado correctamente", imageUrl: data.path });
      } catch (err) {
        console.error("Error al guardar usuario:", err);
        res.status(500).json({ error: err.message });
      }
    });
  } catch (error) {
    console.error("Error general en el servidor:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
}

module.exports = { registerUser };

module.exports = { getToken, registerUser };
