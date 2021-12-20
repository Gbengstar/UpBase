import mongoose from "mongoose";

// configuration setup to connect with the database

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_LOCAL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });
  } catch (error) {
    console.log(error);
  }
};


