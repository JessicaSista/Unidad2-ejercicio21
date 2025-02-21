const User = require("../models/User");

// Display a listing of the resource.
async function index(req, res) {}

// Display the specified resource.
async function show(req, res) {}

// Store a newly created resource in storage.
async function store(req, res) {
  const { name, lastname, username, password, email, bio, profilePic } = req.body;
  const newUser = new User({
    name,
    lastname,
    username,
    password,
    email,
    bio: "",
    profilePic: "",
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
