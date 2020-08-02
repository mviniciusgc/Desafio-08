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
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const itemsInCart = await AsyncStorage.getItem('@GoMktPlace:cart');
      if (itemsInCart) setProducts(JSON.parse(itemsInCart));
    }
    loadProducts();
  }, []);

  const addToCart = useCallback(
    async ({ quantity = 0, ...product }: Product) => {
      const productExistsInCart = products.findIndex(
        prod => prod.id === product.id,
      );

      if (productExistsInCart < 0) {
        setProducts([...products, { ...product, quantity: quantity + 1 }]);
      } else {
        const updatedProductsInCart = products.map(prod =>
          prod.id === product.id
            ? {
                ...prod,
                quantity: prod.quantity + 1,
              }
            : prod,
        );

        setProducts(updatedProductsInCart);
      }

      await AsyncStorage.setItem('@GoMktPlace:cart', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const updatedProductsInCart = products.map(prod =>
        prod.id === id
          ? {
              ...prod,
              quantity: prod.quantity + 1,
            }
          : prod,
      );

      setProducts(updatedProductsInCart);
      await AsyncStorage.setItem('@GoMktPlace:cart', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const updatedProductsInCart = products.map(prod =>
        prod.id === id && !(prod.quantity === 1)
          ? {
              ...prod,
              quantity: prod.quantity - 1,
            }
          : prod,
      );

      setProducts(updatedProductsInCart);
      await AsyncStorage.setItem('@GoMktPlace:cart', JSON.stringify(products));
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
