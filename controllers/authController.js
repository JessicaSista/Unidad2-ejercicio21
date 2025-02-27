const User = require("../models/User");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const userController = require("./userController");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getToken(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.json({ msg: "Credenciales incorrectas." });
    }

    const isValidPassword = await User.comparePassword(req.body.password, user.password);
    if (!isValidPassword) {
      return res.json({ msg: "Credenciales incorrectas2." });
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
    return res.json(token);
  } catch (err) {
    console.error("Error en getToken:", err);
    return res.status(500).json({ error: "Error al autenticar al usuario." });
  }
}

async function registerUser(req, res) {
  try {
    const form = formidable({ multiples: false, keepExtensions: true });

    form.parse(req, async (err, fields, files) => {
      try {
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
          return res.status(400).json({ message: "Email o Username ya están en uso" });
        }

        // Si no existe, subir imagen y registrar usuario
        if (!files.profilePic) {
          return res.status(400).json({ error: "No se encontró la imagen de perfil" });
        }

        const profilePicFile = files.profilePic;

        // Comprobar si el archivo existe
        try {
          if (!fs.existsSync(profilePicFile.filepath)) {
            console.error("El archivo no existe en la ruta:", profilePicFile.filepath);
            return res.status(500).json({ error: "Error al acceder al archivo" });
          }
        } catch (err) {
          console.error("Error al verificar la existencia del archivo:", err);
          return res.status(500).json({ error: "Error al verificar el archivo" });
        }

        const ext = path.extname(profilePicFile.originalFilename);
        const newFileName = `image_${Date.now()}${ext}`;

        // Subir la imagen a Supabase
        let data;
        try {
          const stream = fs.createReadStream(profilePicFile.filepath);
          const { data: uploadData, error } = await supabase.storage
            .from("profilepics")
            .upload(newFileName, stream, {
              cacheControl: "3600",
              upsert: false,
              contentType: profilePicFile.mimetype,
            });

          if (error) {
            console.error("Error al subir imagen a Supabase:", error);
            return res.status(500).json({ error: "Error al subir imagen" });
          }
          data = uploadData;
        } catch (err) {
          console.error("Error al subir imagen a Supabase:", err);
          return res
            .status(500)
            .json({ error: "Error al subir imagen a Supabase", details: error });
        }

        // Crear usuario
        try {
          const newUser = await userController.store({ ...fields, profilePic: data.path });
          res
            .status(201)
            .json({ message: "Usuario registrado correctamente", imageUrl: data.path });
        } catch (err) {
          console.error("Error al guardar usuario:", err);
          return res.status(500).json({ error: err.message });
        }
      } catch (err) {
        console.error("Error en la lógica de registro:", err);
        return res.status(500).json({ error: "Error en la lógica de registro de usuario" });
      }
    });
  } catch (err) {
    console.error("Error general en el servidor:", err);
    return res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
}

module.exports = { getToken, registerUser };
