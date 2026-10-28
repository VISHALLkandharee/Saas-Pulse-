console.log("[BOOTSTRAP] Server starting...");
import "dotenv/config";


import { createServer } from "http";
import app from "./app";
import { initSocket } from "./utils/socket";
import { connectRedis } from "./utils/redis";

const port = process.env.PORT || 8000;
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Initialize Redis
connectRedis();

httpServer.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
