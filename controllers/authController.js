const User = require("../models/User");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const { json } = require("express");
const jwt = require("jsonwebtoken");
const userController = require("./userController");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function getToken(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.json({ msg: "Credenciales incorrectas." });

  const isValidPassword = await User.comparePassword(req.body.password, user.password);
  if (!isValidPassword) return res.json({ msg: "Credenciales incorrectas2." });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  return res.json({
    id: user.id,
    username: user.username,
    profilePic: user.profilePic,
    token: token,
  });
}

async function registerUser(req, res) {
  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ message: "Error al procesar el formulario" });
      }

      const username = fields.username;
      const email = fields.email;

      // Verificamos si el usuario ya existe antes de subir la imagen
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: "Email o Username ya están en uso" });
      }

      // Subir imagen solo si el usuario no existe
      let profilePicUrl = null;
      if (files.profilePic) {
        const ext = path.extname(files.profilePic.originalFilename);
        const newFileName = `image_${Date.now()}${ext}`;

        // Subir imagen a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("profilepics")
          .upload(newFileName, fs.createReadStream(files.profilePic.filepath), {
            cacheControl: "3600",
            upsert: false,
            contentType: files.profilePic.mimetype,
            duplex: "half",
          });

        if (uploadError) {
          return res
            .status(500)
            .json({ message: "Error al subir la imagen", error: uploadError.message });
        }

        // Generamos la URL pública
        profilePicUrl = supabase.storage.from("profilepics").getPublicUrl(uploadData.path)
          .data.publicUrl;
      }

      // Crear nuevo usuario con la URL de la imagen
      const newUser = new User({
        firstname: fields.firstname,
        lastname: fields.lastname,
        username: fields.username,
        password: fields.password,
        email: fields.email,
        bio: fields.bio,
        profilePic: profilePicUrl, // Guardamos la URL pública
      });

      await newUser.save();
      res.status(201).json({ message: "Usuario registrado correctamente", user: newUser });
    });
  } catch (error) {
    console.error("Error en registerUser:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}

module.exports = { getToken, registerUser };
