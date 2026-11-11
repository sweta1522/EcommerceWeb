import { formatPrice, getProductImage } from '../utils.js';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => (
  <div className="cart-item">
    <div className="cart-item-image">
      <img src={getProductImage(item)} alt={item.title} />
    </div>
    <div className="cart-item-details">
      <h3>{item.title}</h3>
      <p>{formatPrice(item.price)}</p>
      <div className="cart-item-actions">
        <button
          type="button"
          aria-label={`Decrease quantity for ${item.title}`}
          onClick={() => onUpdateQuantity(item.product_id, -1)}
        >
          -
        </button>
        <span>{item.quantity}</span>
        <button
          type="button"
          aria-label={`Increase quantity for ${item.title}`}
          onClick={() => onUpdateQuantity(item.product_id, 1)}
        >
          +
        </button>
        <button
          type="button"
          className="remove-cart-item"
          aria-label={`Remove ${item.title} from cart`}
          onClick={() => onRemove(item.product_id)}
        >
          Remove
        </button>
      </div>
    </div>
  </div>
);

const Cart = ({
  items,
  itemCount,
  totalPrice,
  onUpdateQuantity,
  onRemove,
  onBuy,
  onContinueShopping,
}) => (
  <aside className="cart-panel" aria-label="Shopping cart">
    <div className="cart-header">
      <h2>Cart</h2>
      <span className="cart-count">
        {itemCount} item{itemCount === 1 ? '' : 's'}
      </span>
      <button
        type="button"
        className="continue-shopping"
        aria-label="Continue shopping"
        onClick={onContinueShopping}
      >
        Continue shopping
      </button>
    </div>

    <div className="cart-items" aria-live="polite">
      {items.length ? (
        items.map((item) => (
          <CartItem
            key={item.product_id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemove={onRemove}
          />
        ))
      ) : (
        <div className="empty-cart">Your cart is empty.</div>
      )}
    </div>

    <div className="cart-footer">
      <div className="cart-total-row">
        <span>Total</span>
        <strong>{formatPrice(totalPrice)}</strong>
      </div>
      <button
        type="button"
        className="buy-button"
        aria-label="Buy products in cart"
        disabled={!items.length}
        onClick={onBuy}
      >
        Buy items
      </button>
    </div>
  </aside>
);

export default Cart;
