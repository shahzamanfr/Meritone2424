import dotenv from "dotenv";
import path from "path";
import express from "express";
import cors from "cors";

// Force load .env from the root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { handleDemo } from "./routes/demo";
// import { handleUserSearch } from "./routes/user-search";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/verify-env", (req, res) => {
    res.json({
      groq_key_exists: !!process.env.VITE_GROQ_API_KEY,
      groq_key_length: process.env.VITE_GROQ_API_KEY?.length || 0,
      groq_key_prefix: process.env.VITE_GROQ_API_KEY?.substring(0, 8) + "...",
      cwd: process.cwd()
    });
  });

  app.get("/api/demo", handleDemo);

  // Groq Proxy Route
  app.post("/api/groq", async (req, res) => {
    try {
      const apiKey = process.env.VITE_GROQ_API_KEY || process.env.GROQ_API_KEY;

      if (!apiKey) {
        console.error("[Groq Proxy] API Key is missing from environment variables.");
        return res.status(500).json({ error: "Groq API key not configured on server. Please check your .env file." });
      }

      console.log(`[Groq Proxy] Calling Groq API with key ${apiKey.substring(0, 8)}...`);

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(req.body)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(`[Groq Proxy Error] Status ${response.status}:`, data);
        return res.status(response.status).json({
          error: data.error?.message || "Groq API error",
          details: data
        });
      }

      res.status(200).json(data);
    } catch (error: any) {
      console.error("Groq Proxy Exception:", error);
      res.status(500).json({ error: error.message || "Failed to contact Groq API" });
    }
  });

  return app;
}
