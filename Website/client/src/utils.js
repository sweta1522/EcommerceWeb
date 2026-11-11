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

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80';

export const formatPrice = (value) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));

export const getProductImage = (product) => {
  const pool = productImageMap[product.category] || productImageMap.Electronics;
  const imageId = pool[(Number(product.product_id) - 1) % pool.length];

  return `https://images.unsplash.com/${imageId}?auto=format&fit=crop&w=900&q=80`;
};
