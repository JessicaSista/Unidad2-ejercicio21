const faker = require("@faker-js/faker").fakerES;
const User = require("../models/User");

module.exports = async () => {
  try {
    const users = [];
    for (let i = 0; i < 100; i++) {
      const firstName = faker.person.firstName().toLowerCase();
      const lastName = faker.person.lastName().toLowerCase();

      const cantAleatoria = faker.number.int({ min: 0, max: 15 });
      const randomFollowing = faker.helpers.arrayElements(users, cantAleatoria);
      const randomIds = randomFollowing.map((follow) => follow._id);

      const newUser = new User({
        firstname: firstName,
        lastname: lastName,
        username: faker.internet.username(),
        password: "1234",
        email: faker.internet.email({ firstName, lastName, provider: "gmail.com" }),
        description: faker.lorem.sentence(2),
        following: randomIds,
        profilePic: "ha_logo.png",
        //no tiene tweet list porque solo va en el seeder de artículos
      });

      for (following of randomFollowing) {
        following.followers.push(newUser._id);
        await following.save();
      }

      users.push(newUser);
    }

    await User.insertMany(users);

    console.log("[Database] Se corrió el seeder de Users.");
  } catch (error) {
    console.error("Error al ejecutar el seeder de usuarios:", error);
  }
};
