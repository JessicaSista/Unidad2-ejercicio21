const { mongoose, Schema } = require("../db");

const tweetSchema = new Schema(
  {
    text: { type: String, maxlength: 280 },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true /* ya vino creada y por lo que entiendo agrega automáticamente 'createdAt' */,
  },
);

const Tweet = mongoose.model("Tweet", tweetSchema); // Entre comillas se coloca el nombre del modelo en mayúscula y en singular.

module.exports = Tweet;
