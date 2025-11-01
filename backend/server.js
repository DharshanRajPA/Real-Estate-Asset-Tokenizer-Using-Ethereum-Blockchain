import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import cors from "cors";
import compression from "compression";
import http from "http";

dotenv.config();

const app = express();
const server = http.createServer(app); // HTTP server for socket.io

app.use(express.json());
app.use(cors());
app.use(compression());

// API routes
app.use("/api", routes);

// Start server
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () =>
      console.log(`✅ Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
};

startServer();
