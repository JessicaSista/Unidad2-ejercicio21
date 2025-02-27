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
    // Supabase Cloud Storage y Formidable
    // Los archivos no se guardarán en el file system, sino en Supabase. Sin embargo, internamente, Formidable guarda los
    // archivos temporalmente en un directorio temporal (que en Windows se llama “Temp”).

    // LÓGICA NUEVA {
    const form = formidable({
      multiples: true,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      const ext = path.extname(files.profilePic.filepath); //(opcional)
      const newFileName = `image_${Date.now()}${ext}`; // el nombre de las imágenes va a estar compuesto por la palabra “image_” seguido de la fecha y hora actual (opcional)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profilepics")
        .upload(newFileName, fs.createReadStream(files.profilePic.filepath), {
          cacheControl: "3600",
          upsert: false,
          contentType: files.profilePic.mimetype,
          duplex: "half", // esta opción es poco común, asegúrate de que sea necesaria
        });

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ message: "Error al subir el archivo a Supabase" });
      }

      // Aquí, ahora puedes manejar 'uploadData' si lo necesitas
      console.log(uploadData);
      // } LÓGICA NUEVA
      // LÓGICA VIEJA {
      const username = fields.username;
      const email = fields.email;
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        const { data, error } = await supabase.storage
          .from("profilepics")
          .remove([files.profilePic.filepath]); //a chequear, saco de internet, si funciona ponerlo en el update del user controller

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
  // } LÓGICA VIEJA
}

module.exports = { getToken, registerUser };
