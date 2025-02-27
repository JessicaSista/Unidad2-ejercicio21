const User = require("../models/User");
const { faker } = require("@faker-js/faker");

module.exports = async () => {
  try {
    const users = [];

    // 1. Crear usuarios sin relaciones
    for (let i = 0; i < 100; i++) {
      const firstName = faker.person.firstName().toLowerCase();
      const lastName = faker.person.lastName().toLowerCase();

      const newUser = new User({
        firstname: firstName,
        lastname: lastName,
        username: faker.internet.userName(),
        password: "1234",
        email: faker.internet.email({ firstName, lastName, provider: "gmail.com" }),
        description: faker.lorem.sentence(2),
        following: [],
        following: [],
        profilePic: "ha_logo.png",
      });

      users.push(newUser);
    }

    // 2. Insertar los usuarios en la BD
    await User.insertMany(users);
    console.log("[Database] Usuarios creados.");

    // 3. Ahora asignar las relaciones de following y followers
    for (let user of users) {
      const cantAleatoria = faker.number.int({ min: 0, max: 15 });
      const randomFollowing = faker.helpers.arrayElements(users, cantAleatoria);
      const randomIds = randomFollowing.map((follow) => follow._id);

      user.following = randomIds;
      await user.save();

      // Agregar followers a los usuarios seguidos
      for (let following of randomFollowing) {
        await User.findByIdAndUpdate(following._id, { $push: { followers: user._id } });
      }
    }

    console.log("[Database] Se actualizaron los following y followers.");
  } catch (error) {
    console.error("Error al ejecutar el seeder de usuarios:", error);
  }
};
