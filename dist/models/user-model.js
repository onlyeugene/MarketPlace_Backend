"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, "Username must be at least 3 characters long"],
        maxlength: [30, "Username cannot exceed 30 characters"],
    },
    firstname: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name cannot exceed 50 characters"],
    },
    tempEmail: { type: String },
    lastname: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    dob: { type: Date },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        select: false,
    },
    phone: { type: String, trim: true, default: null },
    address: {
        street: { type: String, trim: true, default: null },
        city: { type: String, trim: true, default: null },
        state: { type: String, trim: true, default: null },
        country: { type: String, trim: true, default: null },
        postalCode: { type: String, trim: true, default: null },
    },
    role: {
        type: String,
        enum: ["user", "admin", "moderator"],
        default: "user",
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    loginAttempts: [
        {
            ip: String,
            success: Boolean,
            timestamp: Date,
        },
    ],
    sessionVersion: { type: Number, default: 0 },
}, {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});
userSchema.index({ role: 1 });
// Virtual
userSchema.virtual("fullName").get(function () {
    return `${this.firstname} ${this.lastname}`;
});
// Pre-save hook to hash password
userSchema.pre("save", function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (this.isModified("password")) {
            this.password = yield bcryptjs_1.default.hash(this.password, 12);
        }
        next();
    });
});
// Pre-update hook
userSchema.pre(["updateOne", "findOneAndUpdate"], function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});
// Methods
userSchema.methods.comparePassword = function (candidatePassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcryptjs_1.default.compare(candidatePassword, this.password);
    });
};
userSchema.methods.updateLastLogin = function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.lastLogin = new Date();
        yield this.save();
    });
};
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto_1.default.randomBytes(32).toString("hex");
    this.passwordResetToken = crypto_1.default.createHash("sha256").update(resetToken).digest("hex");
    this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
};
userSchema.methods.logLoginAttempt = function (ip, success) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.loginAttempts) {
            this.loginAttempts = [];
        }
        this.loginAttempts.push({ ip, success, timestamp: new Date() });
        yield this.save();
    });
};
userSchema.methods.invalidateOtherSessions = function () {
    return __awaiter(this, void 0, void 0, function* () {
        this.sessionVersion = (this.sessionVersion || 0) + 1;
        yield this.save();
    });
};
const User = mongoose_1.default.model("MarketPlaceUsers", userSchema);
exports.default = User;
