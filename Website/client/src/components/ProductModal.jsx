import { useEffect } from 'react';
import { formatPrice, getProductImage } from '../utils.js';

const ProductModal = ({ product, onClose }) => {
  useEffect(() => {
    if (!product) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  return (
    <div className={`product-modal${product ? ' open' : ''}`} aria-hidden={!product}>
      <div className="product-modal-backdrop" onClick={onClose} />
      <div className="product-modal-content" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <button type="button" className="close-modal" aria-label="Close product details" onClick={onClose}>
          ×
        </button>
        {product && (
          <>
            <div className="product-hero">
              <img src={getProductImage(product)} alt={product.title} />
            </div>
            <div className="product-modal-body">
              <span className="modal-category">{product.category}</span>
              <h2 id="modalTitle">{product.title}</h2>
              <div className="modal-meta">
                <div>
                  <span className="label">Price</span>
                  <strong>{formatPrice(product.price)}</strong>
                </div>
                <div>
                  <span className="label">Stock</span>
                  <strong>{product.stock_quantity}</strong>
                </div>
              </div>
              <div className="modal-details">
                <p>
                  <strong>SKU:</strong> <span>{product.sku}</span>
                </p>
                <p>
                  <strong>ID:</strong> <span>{product.product_id}</span>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductModal;
