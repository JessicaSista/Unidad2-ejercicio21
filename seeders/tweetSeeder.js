const { faker } = require("@faker-js/faker");
const Tweet = require("../models/Tweet");
const User = require("../models/User");

module.exports = async () => {
  try {
    const tweets = [];
    const users = await User.find();

    for (let i = 0; i < 50; i++) {
      const randomUser = users[faker.number.int({ min: 0, max: users.length - 1 })];

      const newTweet = new Tweet({
        text: faker.lorem.sentence(20).substring(0, 280), // Asegura máximo 140 caracteres
        user: randomUser._id,
        username: randomUser.username,
        createdAt: faker.date.past(),
        likes: [randomUser._id],
      });

      tweets.push(newTweet);

      // Agregar el tweet a ambos arrays

      randomUser.tweetList.push(newTweet._id);
    }

    await Tweet.insertMany(tweets);
    await Promise.all(users.map((user) => user.save())); // Guardar todos los usuarios de una vez

    console.log("[Database] Se corrió el seeder de Tweets correctamente.");
  } catch (error) {
    console.error("Error al ejecutar el seeder de Tweets:", error);
  }
};
