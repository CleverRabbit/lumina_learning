import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // OpenRouter Proxy (to keep keys on server if needed, but for now we'll allow client-side for demo purposes as per guidelines, 
  // but let's provide a server-side option for "production" feel)
  app.post("/api/llm/openrouter", async (req, res) => {
    const { apiKey, messages, model } = req.body;
    if (!apiKey) return res.status(400).json({ error: "API Key required" });

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lumina-learning.app",
          "X-Title": "Lumina Learning",
        },
        body: JSON.stringify({
          model: model || "google/gemini-2.0-flash-001",
          messages,
        }),
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from OpenRouter" });
    }
  });

  // Logging Export
  app.post("/api/logs/export", (req, res) => {
    const { logs } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `logs-${timestamp}.json`;
    // In a real app we'd save to disk or cloud storage. 
    // Here we'll just echo back or provide a download link simulation.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(JSON.stringify(logs, null, 2));
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
