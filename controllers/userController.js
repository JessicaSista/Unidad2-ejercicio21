const formidable = require("formidable");
const bcrypt = require("bcryptjs");
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
    res.json({ user });
  } catch (err) {
    console.log(err);
  }
}

// Store a newly created resource in storage.
async function store(req, res) {
  const form = formidable({
    multiples: false,
    uploadDir: path.join(__dirname, "/../public/img"), //importante poner /../ para ir hacia atrás, solo con ../ NO FUNCIONA
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    const hashedPassword = await bcrypt.hash(fields.password, 10);
    const newUser = new User({
      firstname: fields.firstname,
      lastname: fields.lastname,
      username: fields.username,
      password: hashedPassword,
      email: fields.email,
      bio: fields.bio,
      profilePic: files.profilePic.newFilename, //se tiene que llamar profilePic el campo1!
    });
    await newUser.save();
    res.json({ user: newUser });
  });
}

// Update the specified resource in storage.
async function update(req, res) {
  const id = req.params.id;
  const toFollow = await User.findById(id); //encuentro el usuario a seguir (o no)

  // const user = req.auth;
  // user no existe pero sería la persona que está autenticada, lo haríamos con el middelware

  if (user.following.includes(toFollow.username)) {
    //si lo seguía
    user.following.pull(toFollow.username); //saco a ese usuario como seguidor
    toFollow.followers.pull(user.username); //me saco como seguidor de ese usuario
  } else {
    //si no lo seguía
    user.following.push(toFollow.username); //agrego a ese usuario como seguidor
    toFollow.followers.push(user.username); //me agrego como seguidor de ese usuario
  }

  //guardo los cambios en la base de datos
  await user.save();
  await toFollow.save();
}

// Remove the specified resource from storage.
async function destroy(req, res) {}

async function getFollowers(req, res) {
  const { id } = req.params;
  const user = await User.findById(id).populate("followers", "username");
  res.json({ follower: user.followers });
}

async function getFollowing(req, res) {
  const { id } = req.params;
  const user = await User.findById(id).populate("following", "username");
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
  getFollowers,
  getFollowing,
};
