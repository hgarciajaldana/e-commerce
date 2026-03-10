import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  monedaSimbolo?: string;
}

export default function ProductGrid({ products, monedaSimbolo = '$' }: ProductGridProps) {
  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product, index) => (
        <div
          key={product.id}
          className="stagger-item"
          style={{ '--stagger-delay': `${Math.min(index * 60, 480)}ms` } as React.CSSProperties}
        >
          <ProductCard
            product={product}
            monedaSimbolo={monedaSimbolo}
          />
        </div>
      ))}
    </div>
  );
}
