import { useCallback, useEffect, useState } from 'react';

const readView = () => (window.location.hash === '#/cart' ? 'cart' : 'products');

const useHashView = () => {
  const [view, setViewState] = useState(readView);

  useEffect(() => {
    const onHashChange = () => setViewState(readView());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setView = useCallback((next) => {
    window.location.hash = next === 'cart' ? '#/cart' : '#/products';
  }, []);

  return [view, setView];
};

export default useHashView;
