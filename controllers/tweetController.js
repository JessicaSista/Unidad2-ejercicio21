const Tweet = require("../models/Tweet");

async function index(req, res) {
  const tweets = await Tweet.find().sort({ createdAt: -1 }).limit(20);
  res.json(tweets);
}

// Display the specified resource.
async function show(req, res) {}

// Store a newly created resource in storage.
async function store(req, res) {
  const { text } = req.body;
  const userId = req.auth.sub;
  const newTweet = await Tweet.create({ text, user: userId });
  res.json(newTweet);
}

// Update the specified resource in storage.
async function update(req, res) {
  const tweet = await Tweet.findById(req.params.id);
  const userId = req.auth.sub;
  tweet.likes.includes(userId) ? tweet.likes.pull(userId) : tweet.likes.push(userId);
  await tweet.save();
  res.json(tweet);
}

// Remove the specified resource from storage.
async function destroy(req, res) {
  const tweet = await Tweet.findById(req.params.id);
  await tweet.deleteOne();
  res.json({ message: "El tweet se ha eliminado correctamente" });
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
