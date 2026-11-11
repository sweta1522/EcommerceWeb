import ProductCard from './ProductCard.jsx';

const ProductGrid = ({ products, error, onView, onAdd }) => {
  let content;
  if (error) {
    content = <div className="empty-state">Unable to load products. {error}</div>;
  } else if (!products.length) {
    content = <div className="empty-state">No products found.</div>;
  } else {
    content = products.map((product) => (
      <ProductCard key={product.product_id} product={product} onView={onView} onAdd={onAdd} />
    ));
  }

  return (
    <div className="grid-panel" aria-label="Product listing">
      <div className="product-grid" aria-live="polite">
        {content}
      </div>
    </div>
  );
};

export default ProductGrid;
