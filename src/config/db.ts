import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async (): Promise<void> => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(MONGODB_URI!);
      console.log('Connected to MongoDB 🎉');
      break;
    } catch (err: any) {
      console.error(`❌ MongoDB connection failed, retries left: ${retries - 1} - ${err.message}`);
      retries -= 1;
      await new Promise((res) => setTimeout(res, 5000)); // wait 5 seconds
    }
  }
};

export default connectDB;