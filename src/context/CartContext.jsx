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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        const newQty = existing.qty + 1;
        const totalItems = prev.reduce((sum, i) => sum + (i.id === product.id ? newQty : i.qty), 0);
        showToast(`${product.name} quantity updated in cart. Cart items: ${totalItems}`);
        return prev.map((i) => (i.id === product.id ? { ...i, qty: newQty } : i));
      }
      const totalItems = prev.reduce((sum, i) => sum + i.qty, 0) + 1;
      showToast(`${product.name} added to cart. Cart items: ${totalItems}`);
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          mrp: parseFloat(product.mrp || product.price),
          gst: parseFloat(product.gst || 0),
          hsn: product.hsn || '',
          img: product.imgUrl || '',
          qty: 1
        }
      ];
    });
  }, [showToast]);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id ? { ...i, qty } : i));
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const gstAmount = items.reduce((sum, i) => sum + (i.price * i.qty * (i.gst || 0)) / 100, 0);
    return { subtotal, gstAmount };
  }, [items]);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totals, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
