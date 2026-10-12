const state = {
  page: 1,
  limit: 25,
  category: 'all',
  sort: 'price_asc',
  search: '',
  total: 0,
  totalPages: 1,
  products: [],
  view: 'products',
  nextCursor: null,
  hasMore: false,
};

const productImageMap = {
  Electronics: [
    'photo-1518770660439-4636190af475',
    'photo-1523275335684-37898b6baf30',
    'photo-1546868871-7041f2a55e12',
    'photo-1583394838336-acd977736f90',
  ],
  'Home & Living': [
    'photo-1505693416388-ac5ce068fe85',
    'photo-1494526585095-c41746248156',
    'photo-1484101403633-562f891dc89a',
    'photo-1505693416388-ac5ce068fe85',
  ],
  Clothing: [
    'photo-1521572267360-ee0c2909d518',
    'photo-1529139574466-a303027c1d8b',
    'photo-1483985988355-763728e1935b',
    'photo-1524504388940-b1c1722653e1',
  ],
  Sports: [
    'photo-1517836357463-d25dfeac3438',
    'photo-1571019614242-c5c5dee9f50b',
    'photo-1541534401786-2077eed87a74',
    'photo-1517838277536-f5f99be501cd',
  ],
  Kitchenware: [
    'photo-1556911220-bff31c812dba',
    'photo-1556910103-1c02745aae4d',
    'photo-1504674900247-0877df9cc836',
    'photo-1556911073-3815fd6f0c84',
  ],
};

const appShell = document.querySelector('.app-shell');
const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortByPrice = document.getElementById('sortByPrice');
const cartLinkBtn = document.getElementById('cartLinkBtn');
const cartBadge = document.getElementById('cartBadge');
const continueShoppingBtn = document.getElementById('continueShoppingBtn');
const totalProducts = document.getElementById('totalProducts');
const currentPageLabel = document.getElementById('currentPageLabel');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbers = document.getElementById('pageNumbers');
const pageSizeSelect = document.getElementById('pageSizeSelect');
const cartCount = document.getElementById('cartCount');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const buyCartBtn = document.getElementById('buyCartBtn');
const productModal = document.getElementById('productModal');
const modalHero = document.getElementById('modalHero');
const modalImage = document.getElementById('modalImage');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const modalStock = document.getElementById('modalStock');
const modalSku = document.getElementById('modalSku');
const modalId = document.getElementById('modalId');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value));
}

function getProductImage(product) {
  const pool = productImageMap[product.category] || productImageMap.Electronics;
  const selectedIndex = (Number(product.product_id) - 1) % pool.length;
  const imageId = pool[selectedIndex];

  return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`;
}

function renderPagination() {
  const maxButtons = 7;
  const pages = [];
  let startPage = Math.max(1, state.page - Math.floor(maxButtons / 2));
  const endPage = Math.min(state.totalPages, startPage + maxButtons - 1);

  if (endPage - startPage + 1 < maxButtons) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  for (let page = startPage; page <= endPage; page += 1) {
    pages.push(page);
  }

  pageNumbers.innerHTML = '';

  pages.forEach((page) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `page-btn ${page === state.page ? 'active' : ''}`;
    button.textContent = String(page);
    button.disabled = page === state.page;
    button.addEventListener('click', () => {
      state.page = page;
      fetchProducts();
    });
    pageNumbers.appendChild(button);
  });

  prevPageBtn.disabled = state.page <= 1;
  nextPageBtn.disabled = state.page >= state.totalPages;
  totalProducts.textContent = String(state.total);
  currentPageLabel.textContent = `${state.page} / ${state.totalPages}`;
}

function setView(view) {
  state.view = view;
  const isCartView = view === 'cart';

  appShell.classList.toggle('cart-view', isCartView);
  cartLinkBtn.classList.toggle('active', isCartView);
  cartLinkBtn.setAttribute('aria-pressed', String(isCartView));

  const nextHash = isCartView ? '#/cart' : '#/products';
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
}

function syncViewFromHash() {
  const hash = window.location.hash || '#/products';
  setView(hash === '#/cart' ? 'cart' : 'products');
}

function renderProducts(products) {
  state.products = products;

  if (!products.length) {
    productGrid.innerHTML = '<div class="empty-state">No products found.</div>';
    return;
  }

  productGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card" aria-label="Product ${escapeHtml(product.title)}">
          <div class="product-image">
            <img
              src="${getProductImage(product)}"
              alt="${escapeHtml(product.title)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';"
            />
          </div>
          <div class="product-body">
            <div class="product-meta">
              <span class="badge">#${escapeHtml(product.product_id)}</span>
              <span class="category">${escapeHtml(product.category)}</span>
            </div>
            <h3>${escapeHtml(product.title)}</h3>
            <div class="product-info">
              <div>
                <span class="label">Price</span>
                <strong>${formatPrice(product.price)}</strong>
              </div>
              <div>
                <span class="label">Stock</span>
                <strong>${product.stock_quantity}</strong>
              </div>
            </div>
            <div class="product-footer">
              <span class="sku">SKU: ${escapeHtml(product.sku)}</span>
              <div class="card-actions">
                <button type="button" class="card-button secondary" data-product-id="${escapeHtml(product.product_id)}" aria-label="View details for ${escapeHtml(product.title)}">View</button>
                <button type="button" class="card-button add-cart" data-product-id="${escapeHtml(product.product_id)}" aria-label="Add ${escapeHtml(product.title)} to cart">Add to cart</button>
              </div>
            </div>
          </div>
        </article>
      `,
    )
    .join('');
}

function openProductModal(product) {
  if (!product) {
    return;
  }

  modalImage.src = getProductImage(product);
  modalImage.alt = product.title;
  modalCategory.textContent = product.category;
  modalTitle.textContent = product.title;
  modalPrice.textContent = formatPrice(product.price);
  modalStock.textContent = String(product.stock_quantity);
  modalSku.textContent = product.sku;
  modalId.textContent = String(product.product_id);

  productModal.classList.add('open');
  productModal.setAttribute('aria-hidden', 'false');
}

function closeProductModal() {
  productModal.classList.remove('open');
  productModal.setAttribute('aria-hidden', 'true');
}

const cart = new CartComponent({
  container: cartItems,
  countEl: cartCount,
  totalEl: cartTotal,
  buyButton: buyCartBtn,
  badgeEl: cartBadge,
});

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    if (!response.ok) {
      throw new Error(`Categories request failed with status ${response.status}`);
    }

    const categories = await response.json();
    const currentCategory = state.category;

    categoryFilter.innerHTML = '<option value="all">All</option>';
    categories.forEach((category) => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      if (category === currentCategory) {
        option.selected = true;
      }
      categoryFilter.appendChild(option);
    });

    categoryFilter.value = currentCategory;
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

let searchTimer = null;

function handleSearchInput() {
  state.search = searchInput.value.trim();
  state.page = 1;
  state.nextCursor = null;
  state.hasMore = false;

  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    fetchProducts();
  }, 300);
}

function buildProductsQuery(cursor = null) {
  const params = new URLSearchParams({
    limit: String(state.limit),
    sort: state.sort,
  });

  if (state.category !== 'all') {
    params.set('category', state.category);
  }

  if (state.search) {
    params.set('q', state.search);
  }

  if (cursor) {
    params.set('cursorPrice', String(cursor.cursorPrice));
    params.set('cursorProductId', String(cursor.cursorProductId));
  } else {
    params.set('page', String(state.page));
  }

  return params;
}

async function fetchProducts() {
  const params = buildProductsQuery(state.nextCursor);

  try {
    const response = await fetch(`/api/products?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const payload = await response.json();
    state.total = payload.total;
    state.totalPages = payload.totalPages || 1;
    state.hasMore = Boolean(payload.hasMore);
    state.nextCursor = payload.nextCursor || null;

    if (state.page > state.totalPages) {
      state.page = state.totalPages || 1;
    }

    renderPagination();
    renderProducts(payload.products);
  } catch (error) {
    productGrid.innerHTML = `
      <div class="empty-state">Unable to load products. ${escapeHtml(error.message)}</div>
    `;
    console.error(error);
  }
}

productGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.card-button');
  if (!button) {
    return;
  }

  const productId = Number(button.dataset.productId);
  const selectedProduct = state.products.find((product) => product.product_id === productId);

  if (button.classList.contains('add-cart')) {
    cart.addItem(selectedProduct);
    return;
  }

  openProductModal(selectedProduct);
});

cartItems.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cart-action]');
  if (!button) {
    return;
  }

  const productId = Number(button.dataset.productId);
  const action = button.dataset.cartAction;

  if (action === 'increase') {
    cart.updateQuantity(productId, 1);
    return;
  }

  if (action === 'decrease') {
    cart.updateQuantity(productId, -1);
    return;
  }

  if (action === 'remove') {
    cart.removeItem(productId);
  }
});

productModal.addEventListener('click', (event) => {
  if (event.target.matches('[data-close-modal="true"]') || event.target.classList.contains('close-modal')) {
    closeProductModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && productModal.classList.contains('open')) {
    closeProductModal();
  }
});

searchInput.addEventListener('input', handleSearchInput);

categoryFilter.addEventListener('change', (event) => {
  state.category = event.target.value;
  state.page = 1;
  state.nextCursor = null;
  state.hasMore = false;
  fetchProducts();
});

sortByPrice.addEventListener('change', (event) => {
  state.sort = event.target.value;
  state.page = 1;
  state.nextCursor = null;
  state.hasMore = false;
  fetchProducts();
});

pageSizeSelect.addEventListener('change', (event) => {
  state.limit = Number(event.target.value);
  state.page = 1;
  state.nextCursor = null;
  state.hasMore = false;
  fetchProducts();
});

prevPageBtn.addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    state.nextCursor = null;
    fetchProducts();
  }
});

nextPageBtn.addEventListener('click', () => {
  if (state.hasMore || state.page < state.totalPages) {
    if (state.nextCursor) {
      fetchProducts();
      return;
    }

    state.page += 1;
    fetchProducts();
  }
});

buyCartBtn.addEventListener('click', () => {
  cart.buy();
});

cartLinkBtn.addEventListener('click', () => {
  setView(state.view === 'cart' ? 'products' : 'cart');
});

continueShoppingBtn.addEventListener('click', () => {
  setView('products');
});

window.addEventListener('hashchange', () => {
  syncViewFromHash();
});

async function init() {
  await loadCategories();
  syncViewFromHash();
  fetchProducts();
}

init();
