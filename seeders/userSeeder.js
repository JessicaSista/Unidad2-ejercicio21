/*
 * El seeder no es más que un archivo que contiene una función que se encarga
 * de insertar datos (generalmente de prueba) en una base de datos.
 *
 * El nombre "seeder" es una convención y significa "semillero".
 *
 * Además, en este caso, se está usando una librería llamada Faker
 * (https://fakerjs.dev/) para facilitar la creación de datos ficticios como
 * nombres, apellidos, títulos, direcciones y demás textos.
 *
 * Suele ser común que en los seeders exista un `for` donde se define la
 * cantidad de registros de prueba que se insertarán en la base de datos.
 *
 * En este ejemplo se están insertando 100 usuarios con nombres ficticios.
 */

const faker = require("@faker-js/faker").fakerES;
const User = require("../models/User");
const bcrypt = require("bcryptjs");

module.exports = async () => {
  const userPassword = await bcrypt.hash("1234", 10);

  for (let i = 0; i < 100; i++) {
    const firstName = faker.person.firstName().toLowerCase();
    const lastName = faker.person.lastName().toLowerCase();

    const allUsers = await User.find();
    const cantAleatoria = faker.number.int({ min: 0, max: 15 });
    const randomFollowing = faker.helpers.arrayElements(allUsers, cantAleatoria);
    const randomIds = randomFollowing.map((follow) => follow._id);

    const newUser = {
      firstname: firstName,
      lastname: lastName,
      username: faker.internet.username(),
      password: userPassword,
      email: faker.internet.email({ firstName, lastName, provider: "gmail.com" }),
      description: faker.lorem.sentence(2),
      following: randomIds,
      profilePic: "ha_logo.png",
      //no tiene tweet list porque solo va en el seeder de artículos
    };
    for (following of randomFollowing) {
      following.followers.push(newUser._id);
      await following.save();
    }
    User.create(newUser);
  }

  console.log("[Database] Se corrió el seeder de Users.");
};
