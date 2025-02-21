const { mongoose, Schema } = require("../db");

const articleSchema = new Schema(
  {
    title: String,
    content: String,
  },
  {
    timestamps: true,
  },
);

const Article = mongoose.model("Article", articleSchema); // Entre comillas se coloca el nombre del modelo en mayúscula y en singular.

module.exports = Article;
