class CartComponent {
  constructor({ container, countEl, totalEl, buyButton, badgeEl }) {
    this.container = container;
    this.countEl = countEl;
    this.totalEl = totalEl;
    this.buyButton = buyButton;
    this.badgeEl = badgeEl;
    this.items = [];
  }

  addItem(product) {
    const existingItem = this.items.find((item) => item.product_id === product.product_id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }

    this.render();
  }

  updateQuantity(productId, delta) {
    const item = this.items.find((cartItem) => cartItem.product_id === productId);
    if (!item) {
      return;
    }

    item.quantity += delta;

    if (item.quantity <= 0) {
      this.items = this.items.filter((cartItem) => cartItem.product_id !== productId);
    }

    this.render();
  }

  removeItem(productId) {
    this.items = this.items.filter((item) => item.product_id !== productId);
    this.render();
  }

  getTotalPrice() {
    return this.items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }

  render() {
    const totalItems = this.getItemCount();
    const totalPrice = this.getTotalPrice();

    this.countEl.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;
    this.totalEl.textContent = formatPrice(totalPrice);

    if (this.badgeEl) {
      this.badgeEl.textContent = String(totalItems);
    }

    this.buyButton.disabled = this.items.length === 0;

    if (!this.items.length) {
      this.container.innerHTML = '<div class="empty-cart">Your cart is empty.</div>';
      return;
    }

    this.container.innerHTML = this.items
      .map(
        (item) => `
          <div class="cart-item">
            <div class="cart-item-image">
              <img src="${getProductImage(item)}" alt="${item.title}" />
            </div>
            <div class="cart-item-details">
              <h3>${item.title}</h3>
              <p>${formatPrice(item.price)}</p>
              <div class="cart-item-actions">
                <button type="button" data-cart-action="decrease" data-product-id="${item.product_id}" aria-label="Decrease quantity for ${item.title}">-</button>
                <span>${item.quantity}</span>
                <button type="button" data-cart-action="increase" data-product-id="${item.product_id}" aria-label="Increase quantity for ${item.title}">+</button>
                <button type="button" class="remove-cart-item" data-cart-action="remove" data-product-id="${item.product_id}" aria-label="Remove ${item.title} from cart">Remove</button>
              </div>
            </div>
          </div>
        `,
      )
      .join('');
  }

  buy() {
    if (!this.items.length) {
      return;
    }

    alert(`Purchase successful! You bought ${this.getItemCount()} item(s) for ${formatPrice(this.getTotalPrice())}.`);
    this.items = [];
    this.render();
  }
}

window.CartComponent = CartComponent;
