import "dotenv/config";
import http from "http";
import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const HOST = process.env.HOST ?? "0.0.0.0";

const server = http.createServer(app);

async function start(): Promise<void> {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log("[server] Conexión a PostgreSQL establecida");

    server.listen(PORT, HOST, () => {
      console.log(`[server] Corriendo en http://${HOST}:${PORT}`);
      console.log(`[server] Entorno: ${process.env.NODE_ENV ?? "development"}`);
    });
  } catch (err) {
    console.error("[server] Error al iniciar:", err);
    process.exit(1);
  }
}

// ── Graceful shutdown ─────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[server] ${signal} recibido — cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("[server] Servidor cerrado limpiamente");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("[server] Unhandled rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[server] Uncaught exception:", err);
  process.exit(1);
});

start();
