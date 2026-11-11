import { useEffect, useState } from 'react';

const useProducts = ({ page, limit, sort, category, search }) => {
  const [data, setData] = useState({ products: [], total: 0, totalPages: 1 });
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ limit: String(limit), sort, page: String(page) });

    if (category !== 'all') {
      params.set('category', category);
    }
    if (search) {
      params.set('q', search);
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/products?${params}`, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const payload = await response.json();
        setData({
          products: payload.products,
          total: payload.total,
          totalPages: payload.totalPages || 1,
        });
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          setError(err.message);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [page, limit, sort, category, search]);

  return { ...data, error };
};

export default useProducts;
