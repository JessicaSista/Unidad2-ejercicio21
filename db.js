/*
 * Este archivo se creó para tener un lugar centralizando donde esté la
 * conexión a la base de datos.
 *
 * De forma arbitraria se lo nombró `db.js`.
 *
 * Los modelos deberán requerir a este archivo haciendo:
 * const { mongoose, Schema } = require("../db");
 *
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.connect(process.env.DB_CONNECTION_STRING, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
});

module.exports = { mongoose, Schema };
