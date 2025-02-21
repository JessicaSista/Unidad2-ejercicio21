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
  const users = [];
  const userPassword = await bcrypt.hash("1234", 10);

  for (let i = 0; i < 100; i++) {
    users.push({
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
      username: faker.internet.username(),
      password: userPassword,
      email: faker.internet.email(),
      description: faker.lorem.sentence(2),
      //foto de perfil la voy a generar cuando nos funcione todo para que no se guarden muchas fotos en public, por si corremos los seeders muchas veces
      //no tiene tweet list porque solo va en el seeder de artículos
    });
  }

  await User.insertMany(users);
  console.log("[Database] Se corrió el seeder de Users.");
};
