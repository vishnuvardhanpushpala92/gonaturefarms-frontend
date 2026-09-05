import React from 'react';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'gnf_cart';

export function CartProvider({ children }) {
  const showToast = useToast();
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Sync cart across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          const newItems = e.newValue ? JSON.parse(e.newValue) : [];
          setItems(newItems);
        } catch (error) {
          console.error('Error parsing cart from storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const prevArray = prev || [];
      const cartKey = product.variantId ? `${product.id}-${product.variantId}` : `${product.id}`;
      const existing = prevArray.find((i) => {
        const itemKey = i.variantId ? `${i.id}-${i.variantId}` : `${i.id}`;
        return itemKey === cartKey;
      });
      if (existing) {
        const newQty = existing.qty + 1;
        const totalItems = prevArray.reduce((sum, i) => sum + (i.id === product.id ? newQty : i.qty), 0);
        showToast(`${product.name} quantity updated in cart. Cart items: ${totalItems}`);
        return prevArray.map((i) => {
          const itemKey = i.variantId ? `${i.id}-${i.variantId}` : `${i.id}`;
          return itemKey === cartKey ? { ...i, qty: newQty } : i;
        });
      }
      const totalItems = prevArray.reduce((sum, i) => sum + i.qty, 0) + 1;
      showToast(`${product.name} added to cart. Cart items: ${totalItems}`);
      return [
        ...prevArray,
        {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          mrp: parseFloat(product.mrp || product.price),
          gst: parseFloat(product.gst || 0),
          hsn: product.hsn || '',
          img: product.imgUrl || '',
          variantId: product.variantId || null,
          variantName: product.variantName || null,
          qty: 1
        }
      ];
    });
  }, [showToast]);

  const removeItem = useCallback((id, variantId = null) => {
    setItems((prev) => {
      const prevArray = prev || [];
      return prevArray.filter((i) => {
        const itemKey = i.variantId ? `${i.id}-${i.variantId}` : `${i.id}`;
        const targetKey = variantId ? `${id}-${variantId}` : `${id}`;
        return itemKey !== targetKey;
      });
    });
  }, []);

  const updateQty = useCallback((id, qty, variantId = null) => {
    setItems((prev) => {
      const prevArray = prev || [];
      if (qty <= 0) {
        return prevArray.filter((i) => {
          const itemKey = i.variantId ? `${i.id}-${i.variantId}` : `${i.id}`;
          const targetKey = variantId ? `${id}-${variantId}` : `${id}`;
          return itemKey !== targetKey;
        });
      }
      return prevArray.map((i) => {
        const itemKey = i.variantId ? `${i.id}-${i.variantId}` : `${i.id}`;
        const targetKey = variantId ? `${id}-${variantId}` : `${id}`;
        return itemKey === targetKey ? { ...i, qty } : i;
      });
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const itemsArray = items || [];
    const subtotal = itemsArray.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gstAmount = itemsArray.reduce((sum, i) => sum + (i.price * i.qty * (i.gst || 0)) / 100, 0);
    return { subtotal, gstAmount };
  }, [items]);

  const count = useMemo(() => {
    const itemsArray = items || [];
    return itemsArray.reduce((sum, i) => sum + i.qty, 0);
  }, [items]);

  return (
    <CartContext.Provider value={{ items, cart: items, addItem, removeItem, updateQty, clearCart, totals, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
