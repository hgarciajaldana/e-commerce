-- ============================================================
-- Migration: add_pedidos
-- Replaces old Pedido model (usuario_id, subtotal, descuento, PedidoItem)
-- with WhatsApp-checkout model (client fields inline, items JSON, enum estado)
-- Note: Dev data cleared (checkout never persisted real orders to DB)
-- ============================================================

-- Step 1: Clear dev data (pedido_items first due to FK, then pedidos)
TRUNCATE TABLE "pedido_items" CASCADE;
TRUNCATE TABLE "pedidos" CASCADE;

-- Step 2: Drop pedido_items table (items now embedded as JSON in pedidos)
DROP TABLE IF EXISTS "pedido_items";

-- Step 3: Drop old indexes on pedidos
DROP INDEX IF EXISTS "pedidos_empresa_id_deleted_at_idx";
DROP INDEX IF EXISTS "pedidos_empresa_id_usuario_id_idx";
DROP INDEX IF EXISTS "pedidos_empresa_id_estado_idx";

-- Step 4: Drop old foreign key constraints from pedidos
ALTER TABLE "pedidos" DROP CONSTRAINT IF EXISTS "pedidos_cupon_id_fkey";

-- Step 5: Drop old columns from pedidos
ALTER TABLE "pedidos"
  DROP COLUMN IF EXISTS "usuario_id",
  DROP COLUMN IF EXISTS "subtotal",
  DROP COLUMN IF EXISTS "descuento",
  DROP COLUMN IF EXISTS "cupon_id",
  DROP COLUMN IF EXISTS "datos_envio",
  DROP COLUMN IF EXISTS "datos_pago",
  DROP COLUMN IF EXISTS "version",
  DROP COLUMN IF EXISTS "deleted_at",
  DROP COLUMN IF EXISTS "estado";

-- Step 6: Create EstadoPedido enum
CREATE TYPE "EstadoPedido" AS ENUM (
  'pendiente',
  'confirmado',
  'procesando',
  'enviado',
  'entregado',
  'cancelado'
);

-- Step 7: Add new columns to pedidos
ALTER TABLE "pedidos"
  ADD COLUMN "cliente_nombre"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN "cliente_email"      TEXT,
  ADD COLUMN "cliente_telefono"   TEXT NOT NULL DEFAULT '',
  ADD COLUMN "cliente_direccion"  TEXT,
  ADD COLUMN "items"              JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "estado"             "EstadoPedido" NOT NULL DEFAULT 'pendiente',
  ADD COLUMN "whatsapp_enviado"   BOOLEAN NOT NULL DEFAULT false;

-- Step 8: Remove temporary defaults (columns must be NOT NULL going forward)
ALTER TABLE "pedidos"
  ALTER COLUMN "cliente_nombre"   DROP DEFAULT,
  ALTER COLUMN "cliente_telefono" DROP DEFAULT,
  ALTER COLUMN "items"            DROP DEFAULT;

-- Step 9: Update total precision from DECIMAL(10,2) to DECIMAL(12,2)
ALTER TABLE "pedidos"
  ALTER COLUMN "total" TYPE DECIMAL(12,2);

-- Step 10: Create new indexes
CREATE INDEX "pedidos_empresa_id_estado_idx" ON "pedidos"("empresa_id", "estado");
CREATE INDEX "pedidos_created_at_idx" ON "pedidos"("created_at");
