const Tweet = require("../models/Tweet");

async function index(req, res) {
  try {
    const tweets = await Tweet.find().sort({ createdAt: -1 }).limit(20).populate("user"); // Popular el campo "user" de cada tweet

    return res.json(tweets);
  } catch (error) {
    return res.status(500).json({
      message: "Hubo un error buscando los tweets",
      error: error.message,
    });
  }
}

// Display the specified resource.
async function show(req, res) {}

// Store a newly created resource in storage.
async function store(req, res) {
  const { text } = req.body;
  const userId = req.auth.sub;
  if (!text.length) {
    return res.json("El campo text no puede estar vacío");
  }

  try {
    const newTweet = await Tweet.create({ text, user: userId });
    return res.json(newTweet);
  } catch (error) {
    return res.status(500).json({ message: "Hubo un error creado el tweet", error: error.message });
  }
}

// Update the specified resource in storage.
async function update(req, res) {
  try {
    const tweet = await Tweet.findById(req.params.id);
    const userId = req.auth.sub;
    tweet.likes.includes(userId) ? tweet.likes.pull(userId) : tweet.likes.push(userId);
    await tweet.save();
    return res.json(tweet);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Hubo un error actualizando los likes", error: error.message });
  }
}

// Remove the specified resource from storage.
async function destroy(req, res) {
  try {
    const tweet = await Tweet.findById(req.params.id); //usar findbyidannddelete
    await tweet.deleteOne();
    return res.json({ message: "El tweet se ha eliminado correctamente" });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Hubo un error eliminando el tweet", error: error.message });
  }
}

// Otros handlers...
// ...

module.exports = {
  index,
  show,
  store,
  update,
  destroy,
};
