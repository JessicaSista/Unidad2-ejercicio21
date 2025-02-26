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
    const username = req.params.username; // Corregido: usar username en lugar de id
    const user = await User.findOne({ username })
      .select("-password") // Excluye la contraseña
      .populate("tweetList"); // Carga los tweets del usuario

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
    profilePic: data.key, //se tiene que llamar profilePic el campo!
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

      // Si hay una imagen anterior, eliminarla de Supabase
      if (user.profilePic && files.profilePic) {
        const { error } = await supabase.storage.from("profilepics").remove([user.profilePic]);
        if (error) {
          return res.status(500).json({ message: "Error al eliminar la imagen anterior." });
        }
      }

      let newProfilePic = user.profilePic; // foto actual por defecto

      if (files.profilePic) {
        // si hay una nueva imagen, subirla a Supabase
        const ext = path.extname(files.profilePic.filepath);
        const newFileName = `image_${Date.now()}${ext}`;

        const { data, error } = await supabase.storage
          .from("profilepics")
          .upload(newFileName, fs.createReadStream(files.profilePic.filepath), {
            cacheControl: "3600",
            upsert: false,
            contentType: files.profilePic.mimetype, // Usar files.profilePic en lugar de file
            duplex: "half",
          });

        if (error) {
          return res.status(500).json({ message: "Error al subir la nueva imagen." });
        }

        newProfilePic = data.Key; // Reemplaza la foto anterior por la nueva
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
          profilePic: newProfilePic,
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
  const toFollow_id = req.params.id;
  const toFollow = await User.findById(id); //encuentro el usuario a seguir (o no)

  const user = await User.findById(req.auth.sub);

  if (user.following.includes(toFollow_id)) {
    //si lo seguía
    user.following.pull(toFollow_id); //saco a ese usuario como seguidor
    toFollow.followers.pull(user._id); //me saco como seguidor de ese usuario
  } else {
    //si no lo seguía
    user.following.push(toFollow_id); //agrego a ese usuario como seguidor
    toFollow.followers.push(user._id); //me agrego como seguidor de ese usuario
  }

  //guardo los cambios en la base de datos
  await user.save();
  await toFollow.save();
}

async function getFollowers(req, res) {
  const { id } = req.params;
  const user = await User.findById(id).populate("followers");
  res.json({ follower: user.followers });
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
