import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'gnf_language';

const translations = {
  en: {
    // Header
    searchPlaceholder: 'Search products...',
    cart: 'Cart',
    orders: 'Orders',
    account: 'Account',
    admin: 'Admin',
    
    // Product
    addToCart: 'Add to Cart',
    outOfStock: 'Out of Stock',
    price: 'Price',
    mrp: 'MRP',
    
    // Cart
    yourCart: 'Your Cart',
    emptyCart: 'Your cart is empty',
    subtotal: 'Subtotal',
    gst: 'GST',
    total: 'Total',
    viewCart: 'View Cart',
    proceedToCheckout: 'Proceed to Checkout',
    
    // Auth
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    forgotPassword: 'Forgot Password?',
    phone: 'Phone',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    name: 'Name',
    email: 'Email',
    securityQuestion: 'Security Question',
    securityAnswer: 'Security Answer',
    
    // Orders
    trackOrders: 'Track Orders',
    viewMyOrders: 'View My Orders',
    noOrdersFound: 'No orders found.',
    orderPlaced: 'Order Placed',
    orderConfirmed: 'Order Confirmed',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    outForDelivery: 'Out for Delivery',
    delivered: 'Delivered',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    close: 'Close',
    yes: 'Yes',
    no: 'No'
  },
  te: {
    // Header
    searchPlaceholder: 'ఉత్పనులలు శోధిండి...',
    cart: 'కార్టు',
    orders: 'ఆర్డర్లు',
    account: 'ఖాతా',
    admin: 'అడ్మిన్',
    
    // Product
    addToCart: 'కార్టులో చేర్యండి',
    outOfStock: 'స్టాక్ లేదు',
    price: 'ధర',
    mrp: 'MRP',
    
    // Cart
    yourCart: 'మీ కార్టు',
    emptyCart: 'మీ కార్టు ఖాళీగా ఉంది',
    subtotal: 'ఉపమొతం',
    gst: 'GST',
    total: 'మొతం',
    viewCart: 'కార్టు చూడి',
    proceedToCheckout: 'చెకౌట్ చేయండి',
    
    // Auth
    login: 'లాగిన్',
    register: 'నమోదరణ',
    logout: 'లాగ్అవుట్',
    forgotPassword: 'పాస్‌వర్డ్ మరిచింది?',
    phone: 'ఫోన్',
    password: 'పాస్‌వర్డ్',
    confirmPassword: 'పాస్‌వర్డ్ నిర్ధారించి',
    name: 'పేరు',
    email: 'ఇమెయిల్',
    securityQuestion: 'భద్రత ప్రశ్న',
    securityAnswer: 'భద్రత సమాధానం',
    
    // Orders
    trackOrders: 'ఆర్డర్లను ట్రాక్ చేయండి',
    viewMyOrders: 'నా ఆర్డర్లను చూడి',
    noOrdersFound: 'ఆర్డర్లు కనుగోలేదు.',
    orderPlaced: 'ఆర్డర్ ఉంచబడింది',
    orderConfirmed: 'ఆర్డర్ నిర్ధారించబడింది',
    processing: 'ప్రాసెసింగ్',
    packed: 'ప్యాక్ చేయబడింది',
    shipped: 'షిప్ చేయబడింది',
    outForDelivery: 'డెలివరీకి వెళ్లాలో ఉంది',
    delivered: 'అందించబడింది',
    
    // Common
    loading: 'లోడ్ అవుతుంది...',
    error: 'లోపలు',
    success: 'విజయం',
    save: 'సేవ్ చేయండి',
    cancel: 'రద్దుచేయండి',
    submit: 'సమర్పించు',
    close: 'మూసి',
    yes: 'అవును',
    no: 'కాదు'
  },
  hi: {
    // Header
    searchPlaceholder: 'उत्पाद खोजें...',
    cart: 'कार्ट',
    orders: 'ऑर्डर',
    account: 'खाता',
    admin: 'एडमिन',
    
    // Product
    addToCart: 'कार्ट में जोड़ें',
    outOfStock: 'स्टॉक नहीं',
    price: 'मूल्य',
    mrp: 'MRP',
    
    // Cart
    yourCart: 'आपकी कार्ट',
    emptyCart: 'आपकी कार्ट खाली है',
    subtotal: 'उप-मूल्य',
    gst: 'GST',
    total: 'कुल',
    viewCart: 'कार्ट देखें',
    proceedToCheckout: 'चेकआउट करें',
    
    // Auth
    login: 'लॉगिन',
    register: 'रजिस्टर',
    logout: 'लॉगआउट',
    forgotPassword: 'पासवर्ड भूल गया?',
    phone: 'फोन',
    password: 'पासवर्ड',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    name: 'नाम',
    email: 'ईमेल',
    securityQuestion: 'सुरक्षा प्रश्न',
    securityAnswer: 'सुरक्षा उत्तर',
    
    // Orders
    trackOrders: 'ऑर्डर ट्रैक करें',
    viewMyOrders: 'मेरे ऑर्डर देखें',
    noOrdersFound: 'कोई ऑर्डर नहीं मिला.',
    orderPlaced: 'ऑर्डर रखा गया',
    orderConfirmed: 'ऑर्डर की पुष्टि हुई',
    processing: 'प्रसंस्करण में',
    packed: 'पैक किया गया',
    shipped: 'भेज दिया गया',
    outForDelivery: 'डिलीवरी पर है',
    delivered: 'पहुंचा गया',
    
    // Common
    loading: 'लोड हो रहा है...',
    error: 'त्रुटि',
    success: 'सफलता',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    close: 'बंद करें',
    yes: 'हाँ',
    no: 'नहीं'
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && translations[stored]) {
        return stored;
      }
    } catch (e) {
      console.error('Failed to load language preference:', e);
    }
    return 'en';
  });

  const setLanguageAndPersist = useCallback((lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.error('Failed to save language preference:', e);
      }
    }
  }, []);

  const t = useCallback((key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageAndPersist, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
