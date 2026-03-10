-- CreateEnum
CREATE TYPE "TipoPromocion" AS ENUM ('dos_x_uno', 'porcentaje', 'bundle');

-- CreateTable
CREATE TABLE "promociones_especiales" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "tipo" "TipoPromocion" NOT NULL,
    "compra_cantidad" INTEGER,
    "llevas_cantidad" INTEGER,
    "porcentaje" DOUBLE PRECISION,
    "precio_original" DECIMAL(12,2),
    "precio_final" DECIMAL(12,2) NOT NULL,
    "productos_ids" JSONB,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_fin" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promociones_especiales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "promociones_especiales_empresa_id_idx" ON "promociones_especiales"("empresa_id");

-- CreateIndex
CREATE INDEX "promociones_especiales_empresa_id_activa_idx" ON "promociones_especiales"("empresa_id", "activa");

-- AddForeignKey
ALTER TABLE "promociones_especiales" ADD CONSTRAINT "promociones_especiales_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
