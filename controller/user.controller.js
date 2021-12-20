import jwt from "jsonwebtoken";
import { userModel } from "../model/user.js";

//signToken function

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const SendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const signup = async (req, res) => {
  try {
    //get data from req.body to create user in the database

    const User = await userModel.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      confirmPass: req.body.comfirmPass,
    });

    const token = signToken(User._id);

    SendToken(User, 200, res);
  } catch (error) {
    res.status(404).json({
      status: "fail",
      message: error,
    });
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
}


export const update = async (req, res) => {
  try {
    // get user from the database

    const User = await userModel.findById(req.body.id).select("+password");

    // check if the password is correct
    const correctPass = await userModel.correctPassword(
      req.body.confirmPass,
      User.password
    );

    if (!correct) {
      return new Error("incorrect password");
    }

    // update password

    User.password = req.body.password;
    User.confirmPass = req.body.confirmPass;
    await User.save();

    //login user and send token
    const token = signToken(User._id);
    SendToken(User, 201, res);
    res.status(200).json({
      status: "success",
      token,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { email } = req.body.email;
    const user = await userModel.deleteOne({ email });
    res.status(200).json({
      status: "success",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      message: error,
    });
  }
};


