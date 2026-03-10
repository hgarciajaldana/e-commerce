-- CreateTable
CREATE TABLE "colecciones" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "imagen_url" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "colecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coleccion_productos" (
    "coleccion_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "coleccion_productos_pkey" PRIMARY KEY ("coleccion_id","producto_id")
);

-- CreateIndex
CREATE INDEX "colecciones_empresa_id_idx" ON "colecciones"("empresa_id");

-- CreateIndex
CREATE INDEX "colecciones_empresa_id_activa_idx" ON "colecciones"("empresa_id", "activa");

-- CreateIndex
CREATE INDEX "colecciones_empresa_id_deleted_at_idx" ON "colecciones"("empresa_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "colecciones_empresa_id_slug_key" ON "colecciones"("empresa_id", "slug");

-- CreateIndex
CREATE INDEX "coleccion_productos_producto_id_idx" ON "coleccion_productos"("producto_id");

-- AddForeignKey
ALTER TABLE "colecciones" ADD CONSTRAINT "colecciones_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coleccion_productos" ADD CONSTRAINT "coleccion_productos_coleccion_id_fkey" FOREIGN KEY ("coleccion_id") REFERENCES "colecciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coleccion_productos" ADD CONSTRAINT "coleccion_productos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
