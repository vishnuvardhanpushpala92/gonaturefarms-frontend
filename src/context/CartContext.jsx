import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { useToast } from './ToastContext.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'gnf_cart';

export function CartProvider({ children }) {
  const showToast = useToast();
  const [items, setItems] = useState([]);
  const onItemAddedRef = useRef(null);

  // localStorage persistence disabled to prevent cross-tab sync issues
  // Cart is now session-only (persists only while tab is open)

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
        showToast(`Added to cart ✓`);
        const updated = prevArray.map((i) => {
          const itemKey = i.variantId ? `${i.id}-${i.variantId}` : `${i.id}`;
          return itemKey === cartKey ? { ...i, qty: newQty } : i;
        });
        // Trigger callback if set
        if (onItemAddedRef.current) onItemAddedRef.current();
        return updated;
      }
      const totalItems = prevArray.reduce((sum, i) => sum + i.qty, 0) + 1;
      showToast(`Added to cart ✓`);
      const updated = [
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
      // Trigger callback if set
      if (onItemAddedRef.current) onItemAddedRef.current();
      return updated;
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

  const setItemAddedCallback = useCallback((callback) => {
    onItemAddedRef.current = callback;
  }, []);

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
    <CartContext.Provider value={{ items, cart: items, addItem, removeItem, updateQty, clearCart, totals, count, setItemAddedCallback }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
