const { mongoose, Schema } = require("../db");
const bcrypt = require("bcryptjs");

const userSchema = new Schema(
  {
    firstname: String,
    lastname: String,
    username: String,
    password: String,
    email: String,
    bio: String,
    profilePic: String /* porque en el documento vamos a guardar la URL de donde se almacena */,
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    tweetList: [{ type: Schema.Types.ObjectId, ref: "Tweet" }],
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema); // Entre comillas se coloca el nombre del modelo en mayúscula y en singular.

module.exports = User;
