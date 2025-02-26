const formidable = require("formidable");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

// Display a listing of the resource.
async function index(req, res) {}

// Display the specified resource.
async function show(req, res) {
  try {
    const username = req.params.id;

    const user = await User.findOne({ username }).select("-password").populate("tweetList");
    res.json(user);
  } catch (err) {
    console.log(err);
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
    profilePic: files.profilePic.newFilename, //se tiene que llamar profilePic el campo1!
  });
  await newUser.save();
  return newUser;
}

// Update the specified resource in storage.

// Reemplazar el método fs por Supabase
async function update(req, res) {
  const form = formidable({
    multiples: false,
    uploadDir: path.join(__dirname, "/../public/img"),
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    const username = req.params.username;

    try {
      const user = await User.findOne({ username });

      if (user.profilePic) {
        const { data, error } = await supabase.storage
          .from("profilepics")
          .remove([user.profilePic]);

        if (error) {
          console.error("Error al eliminar la imagen anterior de Supabase:", error);
          return res.status(500).json({ error: "Error al eliminar la imagen anterior." });
        }
      }

      let newProfilePic = user.profilePic; // mantener la imagen anterior si no hay nueva

      if (files.profilePic) {
        const file = files.profilePic[0];
        const { data, error } = await supabase.storage
          .from("profile-pics")
          .upload(file.newFilename, file.filepath);

        if (error) {
          console.error("Error al cargar la imagen a Supabase:", error);
          return res.status(500).json({ error: "Error al cargar la nueva imagen." });
        }

        const ext = path.extname(files.avatar.filepath);
        const newFileName = `image_${Date.now()}${ext}`;
      }

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
      console.error("Hubo un error actualizando el usuario:", error);
      res.status(500).json({ error: "Error actualizando el usuario." });
    }
  });
}

/* -------------------------------- */

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
