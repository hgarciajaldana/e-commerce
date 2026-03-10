import ProductList from '@/components/admin/ProductList';

export default function AdminProductosPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Productos</h2>
        <p className="text-sm text-gray-500 mt-1">Gestiona el catálogo de tu tienda</p>
      </div>
      <ProductList />
    </div>
  );
}
