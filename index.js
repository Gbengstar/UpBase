import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { connectDB } from "./configuration/dbConfiguration.js";
import userRouter  from "./routes/uploadRoute.js";
import { router } from "./routes/route.js";
import mongoose from "mongoose";

const app = express();

app.use(express.json());

app.use("/api/v1", userRouter);

app.use("/", router);

const PORT = process.env.PORT || 5004;

//connect to database

connectDB();

mongoose.connection.once("open", () => {
  console.log("database connected!");
  app.listen(PORT, () =>
    console.log(`server runing at http://localhost:${PORT}`)
  );
});
