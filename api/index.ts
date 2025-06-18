/**
 * Entry-point Express untuk Vercel Functions.
 */

import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { setupVite, serveStatic, log } from "../server/vite";
import http from "http";

const app = express();

/* ---------- core middleware ---------- */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ringkas log tiap hit /api
app.use((req, res, next) => {
  const start = Date.now();
  let captured: unknown;

  const origJson = res.json.bind(res) as typeof res.json;            // FIX: cast tepat
  res.json = ((body: any): Response => {                             // FIX: tipe param
    captured = body;
    return origJson(body);                                           // FIX: tanpa rest
  }) as typeof res.json;

  res.on("finish", () => {
    if (!req.path.startsWith("/api")) return;
    const ms = Date.now() - start;
    let line = `${req.method} ${req.path} ${res.statusCode} in ${ms}ms`;
    if (captured) line += ` :: ${JSON.stringify(captured)}`;
    if (line.length > 80) line = `${line.slice(0, 79)}…`;
    log(line);
  });

  next();
});

/* ---------- bootstrapping ---------- */
(async () => {
  await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? err.statusCode ?? 500;
    res.status(status).json({ message: err.message ?? "Internal Server Error" });
    throw err;
  });

  const isVercel = Boolean(process.env.VERCEL);
  const isDev = !isVercel && process.env.NODE_ENV !== "production";

  if (isDev) {
    const server = http.createServer(app);
    await setupVite(app, server);
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () =>
      log(`dev server ready → http://localhost:${PORT}`)
    );
  } else {
    serveStatic(app);
  }
})();

/* one-liner Vercel cares about */
export default app;
