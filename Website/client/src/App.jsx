import { useCallback, useState } from 'react';
import Cart from './components/Cart.jsx';
import Header from './components/Header.jsx';
import Pagination from './components/Pagination.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import ProductModal from './components/ProductModal.jsx';
import Summary from './components/Summary.jsx';
import useCart from './hooks/useCart.js';
import useCategories from './hooks/useCategories.js';
import useDebounce from './hooks/useDebounce.js';
import useHashView from './hooks/useHashView.js';
import useProducts from './hooks/useProducts.js';
import { formatPrice } from './utils.js';

const App = () => {
		

  const [filters, setFilters] = useState({ category: 'all', sort: 'price_asc', limit: 25, search: '' });
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [view, setView] = useHashView();

  const search = useDebounce(filters.search.trim());
  const categories = useCategories();
  const cart = useCart();
  const { products, total, totalPages, error } = useProducts({
    page,
    limit: filters.limit,
    sort: filters.sort,
    category: filters.category,
    search,
  });

    const updateFilter = (key) => (value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const closeModal = useCallback(() => setSelectedProduct(null), []);

  const handleBuy = () => {
    if (!cart.items.length) {
      return;
    }

    alert(`Purchase successful! You bought ${cart.itemCount} item(s) for ${formatPrice(cart.totalPrice)}.`);
    cart.clear();
  };

  const isCartView = view === 'cart';
  const currentPage = Math.min(page, totalPages);

  return (
    <div className={`app-shell${isCartView ? ' cart-view' : ''}`}>
      <Header
        search={filters.search}
        onSearchChange={updateFilter('search')}
        category={filters.category}
        categories={categories}
        onCategoryChange={updateFilter('category')}
        sort={filters.sort}
        onSortChange={updateFilter('sort')}
        limit={filters.limit}
        onLimitChange={updateFilter('limit')}
        cartCount={cart.itemCount}
        cartActive={isCartView}
        onCartToggle={() => setView(isCartView ? 'products' : 'cart')}
      />

      <Summary total={total} page={currentPage} totalPages={totalPages} />

      <section className="content-layout">
        <ProductGrid products={products} error={error} onView={setSelectedProduct} onAdd={cart.addItem} />
        <Cart
          items={cart.items}
          itemCount={cart.itemCount}
          totalPrice={cart.totalPrice}
          onUpdateQuantity={cart.updateQuantity}
          onRemove={cart.removeItem}
          onBuy={handleBuy}
          onContinueShopping={() => setView('products')}
        />
      </section>

      <ProductModal product={selectedProduct} onClose={closeModal} />

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default App;
