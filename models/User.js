const { mongoose, Schema } = require("../db");
const bcrypt = require("bcryptjs");
const Tweet = require("./Tweet");

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
    tweets: [{ type: Schema.Types.ObjectId, ref: "Tweet" }],
    tweetList: [{ type: Schema.Types.ObjectId, ref: "Tweet" }],
  },
  {
    timestamps: true,
  },
);

//siempre que hagamos llamada síncrona hagamos try y catch!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});
userSchema.pre("insertMany", async function (next, users) {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("1234", salt);
  for (const user of users) {
    user.password = hashedPassword;
  }
  next();
});

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  await Tweet.deleteMany({ user: this._id });
  next();
});

const User = mongoose.model("User", userSchema); // Entre comillas se coloca el nombre del modelo en mayúscula y en singular.

module.exports = User;
