const MAX_BUTTONS = 7;

const Pagination = ({ page, totalPages, onPageChange }) => {
  let startPage = Math.max(1, page - Math.floor(MAX_BUTTONS / 2));
  const endPage = Math.min(totalPages, startPage + MAX_BUTTONS - 1);

  if (endPage - startPage + 1 < MAX_BUTTONS) {
    startPage = Math.max(1, endPage - MAX_BUTTONS + 1);
  }

  const pages = Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);

  return (
    <footer className="pagination-bar" aria-label="Pagination controls">
      <button
        type="button"
        aria-label="Go to previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>
      <div className="page-numbers" aria-label="Page numbers">
        {pages.map((number) => (
          <button
            key={number}
            type="button"
            className={`page-btn${number === page ? ' active' : ''}`}
            disabled={number === page}
            onClick={() => onPageChange(number)}
          >
            {number}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label="Go to next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </footer>
  );
};

export default Pagination;
