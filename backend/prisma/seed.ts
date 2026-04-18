/**
 * seed.ts — Datos iniciales del sistema
 *
 * Crea el super_admin inicial si no existe.
 * Este script es idempotente: puede ejecutarse múltiples veces sin duplicar datos.
 *
 * Uso:
 *   npx prisma db seed
 *
 * Requiere en package.json:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = "superadmin@ecomerce.dev";
const SUPER_ADMIN_PASSWORD = "Admin1234!";
const BCRYPT_ROUNDS = 12;

async function main() {
  console.log("🌱 Iniciando seed...");

  // ----- Super Admin inicial -----
  const existingSuperAdmin = await prisma.super_admins.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  });

  if (existingSuperAdmin) {
    console.log(
      `ℹ️  Super admin '${SUPER_ADMIN_EMAIL}' ya existe — omitiendo creación.`
    );
  } else {
    const passwordHash = await bcrypt.hash(SUPER_ADMIN_PASSWORD, BCRYPT_ROUNDS);

    const superAdmin = await prisma.super_admins.create({
      data: {
        email: SUPER_ADMIN_EMAIL,
        password_hash: passwordHash,
        estado: "activo",
        token_version: 0,
      },
    });

    console.log(
      `✅ Super admin creado: ${superAdmin.email} (id: ${superAdmin.id})`
    );
  }

  console.log("✅ Seed completado.");
}

main()
  .catch((error) => {
    console.error("❌ Error durante el seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
