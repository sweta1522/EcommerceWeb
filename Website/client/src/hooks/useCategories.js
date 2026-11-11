import { useEffect, useState } from 'react';

const useCategories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error(`Categories request failed with status ${response.status}`);
        }
        setCategories(await response.json());
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };

    load();
  }, []);

  return categories;
};

export default useCategories;
