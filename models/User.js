const { mongoose, Schema } = require("../db");
const bcrypt = require("bcryptjs");
const Tweet = require("./Tweet");

const userSchema = new Schema(
  {
    firstname: String,
    lastname: String,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
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

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    console.log("Error en pre('save'):", error);
    next(error);
  }
});

userSchema.pre("insertMany", async function (next, users) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("1234", salt);
    for (const user of users) {
      user.password = hashedPassword;
    }
    next();
  } catch (error) {
    console.log("Error en pre('insertMany'):", error);
    next(error);
  }
});

userSchema.statics.comparePassword = async function (inputPassword, userPassword) {
  return await bcrypt.compare(inputPassword, userPassword);
};

userSchema.pre("deleteOne", { document: true, query: false }, async function (next) {
  try {
    await Tweet.deleteMany({ user: this._id });
    next();
  } catch (error) {
    console.log("Error en pre('deleteOne'):", error);
    next(error);
  }
});

const User = mongoose.model("User", userSchema); // Entre comillas se coloca el nombre del modelo en mayúscula y en singular.

module.exports = User;
