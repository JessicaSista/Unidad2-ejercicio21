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

// Store a newly created resource in storage.=
async function store(req, res) {
  const { text } = req.body;
  const userId = req.auth.sub;

  if (!text.length) {
    return res.status(400).json({ message: "El campo text no puede estar vacío" });
  }

  try {
    const newTweet = await Tweet.create({ text, user: userId });

    const creator = await User.findById(userId);
    if (!creator) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    creator.tweetList.push(newTweet._id);
    await creator.save(); // Guardar los cambios en la base de datos

    return res.status(201).json(newTweet);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Hubo un error creando el tweet", error: error.message });
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
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).json({ message: "Tweet no encontrado" });
    }

    // verificamos si el usuario logueado es el dueño del tweet
    if (tweet.user._id.toString() !== req.auth.sub) {
      return res.status(403).json({ message: "No tienes permisos para eliminar este tweet" });
    }
    //si lo es, eliminamos el tweet
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
