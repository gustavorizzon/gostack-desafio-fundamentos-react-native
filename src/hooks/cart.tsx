import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const cart = await AsyncStorage.getItem('@GoMarketplace:cart');

      if (cart) {
        setProducts(JSON.parse(cart));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function updateStorage(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    }

    updateStorage();
  }, [products]);

  const increment = useCallback(
    async id => {
      const foundProductIndex = products.findIndex(p => p.id === id);
      if (foundProductIndex < 0) {
        return;
      }

      const { title, price, quantity, image_url } = products[foundProductIndex];

      const updatedProduct = {
        id,
        title,
        price,
        image_url,
        quantity: quantity + 1,
      };

      const cart = products.map(p => (p.id === id ? updatedProduct : p));

      setProducts(cart);
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const { id, title, image_url, price } = product;

      const foundProductIndex = products.findIndex(p => p.id === id);
      if (foundProductIndex >= 0) {
        increment(id);
        return;
      }

      const newProduct = {
        id,
        title,
        image_url,
        price,
        quantity: 1,
      };

      const cart = [...products, newProduct];

      setProducts(cart);
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const foundProductIndex = products.findIndex(p => p.id === id);
      if (foundProductIndex < 0) {
        return;
      }

      const { title, price, quantity, image_url } = products[foundProductIndex];

      if (quantity <= 1) {
        return;
      }

      const updatedProduct = {
        id,
        title,
        price,
        image_url,
        quantity: quantity - 1,
      };

      const cart = products.map(p => (p.id === id ? updatedProduct : p));

      setProducts(cart);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
