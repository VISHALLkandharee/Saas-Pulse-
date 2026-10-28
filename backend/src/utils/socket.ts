import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "./jwt";

let io: SocketServer;

const allowedOrigins = [
  "http://localhost:3000", 
  "http://192.168.10.23:3000",
  process.env.CLIENT_URL, // Allows production domains
].filter(Boolean) as string[];

export const initSocket = (server: HttpServer) => {
  io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
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

  // Never trust a browser-provided room/user id. The room is derived only from
  // a verified access-token cookie (or an explicitly supplied bearer token).
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const accessToken = cookieHeader
        .split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith("accessToken="))
        ?.slice("accessToken=".length);
      const token = socket.handshake.auth?.token || accessToken;
      if (!token) return next(new Error("Unauthorized socket connection"));

      const user = verifyAccessToken(decodeURIComponent(token));
      socket.data.userId = user.userId;
      next();
    } catch {
      next(new Error("Unauthorized socket connection"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(userId);
    console.log(`[SOCKET] Authenticated user joined private room: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
