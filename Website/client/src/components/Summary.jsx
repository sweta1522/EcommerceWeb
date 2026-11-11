const Summary = ({ total, page, totalPages }) => (
  <section className="summary" aria-label="Product statistics">
    <div className="summary-card" aria-live="polite">
      <span>Total products</span>
      <strong>{total}</strong>
    </div>
    <div className="summary-card" aria-live="polite">
      <span>Current page</span>
      <strong>
        {page} / {totalPages}
      </strong>
    </div>
  </section>
);

export default Summary;
