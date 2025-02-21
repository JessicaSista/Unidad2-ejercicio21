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
async function update(req, res) {}

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
