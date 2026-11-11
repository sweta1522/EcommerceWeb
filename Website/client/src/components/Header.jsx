const Header = ({
  search,
  onSearchChange,
  category,
  categories,
  onCategoryChange,
  sort,
  onSortChange,
  limit,
  onLimitChange,
  cartCount,
  cartActive,
  onCartToggle,
}) => (
  <header className="topbar" aria-label="Product dashboard header">
    <div>
      <p className="eyebrow">Commerce</p>
      <h1>Product Dashboard</h1>
    </div>
    <div className="toolbar" aria-label="Product filters and pagination controls">
      <label className="control-field search-field" htmlFor="searchInput">
        <span className="control-label">Search</span>
        <input
          id="searchInput"
          type="search"
          placeholder="Search products"
          aria-label="Search products"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label className="control-field" htmlFor="categoryFilter">
        <span className="control-label">Category</span>
        <select
          id="categoryFilter"
          aria-label="Filter products by category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="all">All</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label className="control-field" htmlFor="sortByPrice">
        <span className="control-label">Sort by price</span>
        <select
          id="sortByPrice"
          aria-label="Sort products by price"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="price_asc">Low to high</option>
          <option value="price_desc">High to low</option>
        </select>
      </label>
      <label className="control-field" htmlFor="pageSizeSelect">
        <span className="control-label">Page size</span>
        <select
          id="pageSizeSelect"
          aria-label="Select number of products per page"
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={`cart-link${cartActive ? ' active' : ''}`}
        aria-label="View cart"
        aria-pressed={cartActive}
        onClick={onCartToggle}
      >
        <span className="cart-link-text">Cart</span>
        <span className="cart-badge">{cartCount}</span>
      </button>
    </div>
  </header>
);

export default Header;
