"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("./config/db"));
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 9540;
(0, db_1.default)().then(() => {
    app_1.default.listen(PORT, () => {
        console.log(`🔌 Server is running on port ${PORT}`);
    });
});
