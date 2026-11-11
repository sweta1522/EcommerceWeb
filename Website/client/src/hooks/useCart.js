import { useCallback, useMemo, useState } from 'react';

const useCart = () => {
  const [items, setItems] = useState([]);

  const addItem = useCallback((product) => {
    setItems((current) => {
      const exists = current.some((item) => item.product_id === product.product_id);
      return exists
        ? current.map((item) =>
            item.product_id === product.product_id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [...current, { ...product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId, delta) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product_id === productId ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((current) => current.filter((item) => item.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [items],
  );
  const itemCount = useMemo(() => items.reduce((count, item) => count + item.quantity, 0), [items]);

  return { items, addItem, updateQuantity, removeItem, clear, totalPrice, itemCount };
};

export default useCart;
