import { FALLBACK_IMAGE, formatPrice, getProductImage } from '../utils.js';

const ProductCard = ({ product, onView, onAdd }) => (
  <article className="product-card" aria-label={`Product ${product.title}`}>
    <div className="product-image">
      <img
        src={getProductImage(product)}
        alt={product.title}
        loading="lazy"
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = FALLBACK_IMAGE;
        }}
      />
    </div>
    <div className="product-body">
      <div className="product-meta">
        <span className="badge">#{product.product_id}</span>
        <span className="category">{product.category}</span>
      </div>
      <h3>{product.title}</h3>
      <div className="product-info">
        <div>
          <span className="label">Price</span>
          <strong>{formatPrice(product.price)}</strong>
        </div>
        <div>
          <span className="label">Stock</span>
          <strong>{product.stock_quantity}</strong>
        </div>
      </div>
      <div className="product-footer">
        <span className="sku">SKU: {product.sku}</span>
        <div className="card-actions">
          <button
            type="button"
            className="card-button secondary"
            aria-label={`View details for ${product.title}`}
            onClick={() => onView(product)}
          >
            View
          </button>
          <button
            type="button"
            className="card-button add-cart"
            aria-label={`Add ${product.title} to cart`}
            onClick={() => onAdd(product)}
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  </article>
);

export default ProductCard;
