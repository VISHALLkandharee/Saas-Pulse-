"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./utils/prisma"));
async function main() {
    try {
        console.log("Attempting to connect to database...");
        const userCount = await prisma_1.default.user.count();
        console.log(`Success! Current user count: ${userCount}`);
    }
    catch (error) {
        console.error("Connection failed:", error);
    }
    finally {
        await prisma_1.default.$disconnect();
    }
}
main();
