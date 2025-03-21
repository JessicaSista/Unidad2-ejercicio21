const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Display a listing of the resource.
async function index(req, res) {}

// Display the specified resource.
async function show(req, res) {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username })
      .select("-password") // Excluye la contraseña
      .populate({
        path: "tweetList",
        populate: { path: "user", model: User },
        options: { sort: { createdAt: -1 } },
      });

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    res.json(user);
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    res.status(500).json({ message: "Error al obtener usuario." });
  }
}

// Store a newly created resource in storage.
async function store(fields, files) {
  const newUser = new User({
    firstname: fields.firstname,
    lastname: fields.lastname,
    username: fields.username,
    password: fields.password,
    email: fields.email,
    bio: fields.bio,
    profilePic: data.key, //está mal
  });
  await newUser.save();
  return newUser;
}

// Update the specified resource in storage.
async function update(req, res) {
  const form = formidable({
    multiples: false,
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    const username = req.params.username;

    try {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado." });
      }

      let newProfilePic = user.profilePic; // Foto actual por defecto

      if (files.profilePic) {
        // Si hay una nueva imagen, subirla a Supabase y eliminar la naterior

        await supabase.storage.from("profilepics").remove([user.profilePic]);

        const ext = path.extname(files.profilePic.filepath);
        const newFileName = `image_${Date.now()}${ext}`;

        // Subir la nueva imagen a Supabase
        const { data, error } = await supabase.storage
          .from("profilepics")
          .upload(newFileName, fs.createReadStream(files.profilePic.filepath), {
            cacheControl: "3600",
            upsert: false,
            contentType: files.profilePic.mimetype,
            duplex: "half",
          });

        if (error) {
          return res.status(500).json({ message: "Error al subir la nueva imagen." });
        }

        // Guardar la nueva URL o el path de la imagen subida
        newProfilePic = data.path; // Aquí guardas el path correcto
      }

      // Actualizar usuario con los nuevos datos
      const updatedUser = await User.findOneAndUpdate(
        { username },
        {
          firstname: fields.firstname,
          lastname: fields.lastname,
          username: fields.username,
          email: fields.email,
          bio: fields.bio,
          profilePic: newProfilePic, // Usamos la nueva imagen (si existe)
        },
        { new: true },
      );

      res.json(updatedUser);
    } catch (error) {
      console.error(error); // Muestra el error en la consola para diagnóstico
      res.status(500).json({ message: "Error al actualizar el usuario.", error: error.message });
    }
  });
}

// Remove the specified resource from storage.
async function destroy(req, res) {} //eliminar usuario y eliminar sus tweets (on delete cascade en mongoose averiguar) !!!!!!!!!!!!!!!!!!!!!!!!!!!

async function toggleFollow(req, res) {
  try {
    const toFollow_id = req.params.id;
    const userId = req.auth?.sub;

    console.log("🔄 [TOGGLE FOLLOW]");
    console.log("👉 ID del usuario a seguir:", toFollow_id);
    console.log("👤 ID del usuario logueado (desde token):", userId);

    if (!userId) {
      console.log("❌ Token inválido o no presente.");
      return res.status(401).json({ error: "Token inválido" });
    }

    const toFollow = await User.findById(toFollow_id);
    const user = await User.findById(userId);

    if (!user || !toFollow) {
      console.log("❌ Uno de los usuarios no fue encontrado.");
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const yaLoSigue = user.following.includes(toFollow_id);
    console.log("🧐 ¿Ya lo seguía?", yaLoSigue);

    if (yaLoSigue) {
      console.log("➖ Dejando de seguir...");
      user.following.pull(toFollow_id);
      toFollow.followers.pull(user._id);
    } else {
      console.log("➕ Siguiendo usuario...");
      user.following.push(toFollow_id);
      toFollow.followers.push(user._id);
    }

    await user.save();
    await toFollow.save();

    console.log("✅ Cambios guardados exitosamente.");

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error inesperado en toggleFollow:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getFollowers(req, res) {
  const { id } = req.params;
  const user = await User.findById(id).populate("followers");

  res.json({ followers: user.followers });
}

async function getFollowing(req, res) {
  const { id } = req.params;
  const user = await User.findById(id).populate("following");
  res.json({ following: user.following });
}
// Otros handlers...
// ...

module.exports = {
  index,
  show,
  store,
  update,
  destroy,
  toggleFollow,
  getFollowers,
  getFollowing,
};
