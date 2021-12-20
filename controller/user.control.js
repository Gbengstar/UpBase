import pkg from "jsonwebtoken";
const jwt = pkg;
import { userModel } from "../model/userModel.js";
import { catchAsync } from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";
import { promisify } from "util";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers["x-forwarded-proto"] === "https",
  });

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

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await userModel.create({
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    confirmPass: req.body.confirmPass,
  });
  createSendToken(newUser, 201, req, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  // 2) Check if user exists && password is correct
  const user = await userModel.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, req, res);
});

export const logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
export const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await userModel.findById(req.user.id).select("+password");

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPass, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.confirmPass = req.body.confirmPass;
  await user.save();

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});

export const deleteUser = catchAsync(async (req, res, next) => {
  // get the current user

  await userModel.deleteOne({ _id: req.user.id });
  res.status(200).json({
    status: "success",
    message: "We hope to see you back soon!",
  });
});

export const protect = catchAsync(async (req, res, next) => {
  // console.log(req.headers.authorization);
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET_KEY
  );

  // 3) Check if user still exists
  const currentUser = await userModel.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

export const upload = catchAsync(async (req, res, next) => {
  if (req.file) {
    // Update user document
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user.id,
      { image: req.file.filename },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } else {
    next(new AppError("upload a valid image", 500));
  }
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await userModel.findOne({ _id: req.user.id });
  if (!user) {
    next(new AppError("your profilw was not found", 404));
  }
  res.status(201).json({
    status: "success",
    data: user,
  });
});
