import mongoose from "mongoose";
import validator from "validator";
import pkg from "bcryptjs";
const bcrypt = pkg;

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
  },
  email: {
    type: String,
    required: [true, "Your valid email address is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Kindly input a valid email address"],
  },
  password: {
    type: String,
    required: true,
    minlength: [8, "insert a strong password"],
    select: false,
  },

  confirmPass: {
    type: String,
    select: false,
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "the passwords are not the same",
    },
  },
  image: {
    type:String,
    default: "user.jpeg"
  },
});

// middleware to
schema.pre("save", async function (next) {
  // this function is run if password is modified
  if (!this.isModified("password")) return next();

  //the password is hash with the salt of 12
  this.password = await bcrypt.hash(this.password, 12);

  // this delete confirm password field
  this.confirmPass = undefined;
  next();
});

// method to compare password and confirm password
schema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export const userModel = mongoose.model("User", schema);
