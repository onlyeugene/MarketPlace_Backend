"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Initialize environment variables
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI;
const connectDB = async () => {
    let retries = 5;
    while (retries) {
        try {
            await mongoose_1.default.connect(MONGODB_URI);
            console.log('Connected to MongoDB 🎉');
            break;
        }
        catch (err) {
            console.error(`❌ MongoDB connection failed, retries left: ${retries - 1} - ${err.message}`);
            retries -= 1;
            await new Promise((res) => setTimeout(res, 5000)); // wait 5 seconds
        }
    }
};
exports.default = connectDB;
