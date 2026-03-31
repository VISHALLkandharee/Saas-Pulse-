"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log("[BOOTSTRAP] Server starting...");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// Forced reload to pick up controller changes
require("dotenv/config");
const http_1 = require("http");
const app_1 = __importDefault(require("./app"));
const socket_1 = require("./utils/socket");
const port = process.env.PORT || 8000;
const httpServer = (0, http_1.createServer)(app_1.default);
// Initialize Socket.io
(0, socket_1.initSocket)(httpServer);
httpServer.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
});
