"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
let io;
const allowedOrigins = [
    "http://localhost:3000",
    "http://192.168.10.23:3000",
    process.env.CLIENT_URL, // Allows production domains
].filter(Boolean);
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.includes(origin)) {
                    return callback(null, true);
                }
                return callback(new Error("Not allowed by CORS"));
            },
            methods: ["GET", "POST"],
            credentials: true
        },
        transports: ["websocket", "polling"],
    });
    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        if (userId && typeof userId === 'string') {
            socket.join(userId);
            console.log(`[SOCKET] User ${userId} joined private room: ${socket.id}`);
        }
        socket.on("disconnect", () => {
            console.log(`[SOCKET] Client disconnected: ${socket.id}`);
        });
    });
    return io;
};
exports.initSocket = initSocket;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
exports.getIO = getIO;
