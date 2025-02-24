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
  const { firstname, lastname, username, password, email, bio, profilePic } = req.body;
  const newUser = new User({
    firstname,
    lastname,
    username,
    password,
    email,
    bio,
    profilePic: "", //usar la librería si escala a más
  });

  await newUser.save();
  res.json({ user: newUser });
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

// Otros handlers...
// ...

module.exports = {
  index,
  show,
  store,
  update,
  destroy,
};
